"""Conversational movie discovery.

`ask_assistant(query, user)` turns a free-text request like
"I want a dark psychological thriller from the 2010s" into a set of movie
search filters plus a shortlist of matching movies.

Two modes, chosen automatically based on configuration:

1. LLM mode (settings.ANTHROPIC_API_KEY set): sends the query to the
   Anthropic API with a system prompt that forces a strict JSON filter
   object back, parsed here. The API key never leaves the server (spec
   section 28/35) -- the frontend only ever talks to /api/assistant/.

2. Deterministic fallback (no key configured): a rule-based parser that
   matches genre keywords, decades, directors/actors already in our DB,
   and rating cues ("highly rated", "underrated") against Movie metadata.
   This keeps the feature fully functional with zero external dependencies.
"""
from __future__ import annotations

import json
import logging
import re

import requests
from django.conf import settings
from django.db.models import Q

from apps.movies.models import Movie, Genre
from apps.movies.serializers import MovieListSerializer

logger = logging.getLogger(__name__)

ANTHROPIC_TIMEOUT = 15

DECADE_PATTERN = re.compile(r"(19|20)\d0s")

SYSTEM_PROMPT = """You are FlickRate's movie-discovery filter extractor.
Given a user's free-text movie request, respond with ONLY a compact JSON
object (no prose, no markdown fences) with these optional keys:
  "genres": array of genre names (e.g. ["Thriller", "Sci-Fi"])
  "keywords": array of theme/mood keywords (e.g. ["psychological", "dark"])
  "year_min": integer or null
  "year_max": integer or null
  "director": string or null
  "actor": string or null
  "min_rating": number (0-10) or null
  "explanation": one short sentence describing what you're looking for
Only include fields you can confidently infer from the request."""


def _call_anthropic(query: str) -> dict | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.ANTHROPIC_MODEL,
                "max_tokens": 500,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": query}],
            },
            timeout=ANTHROPIC_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
        raw = "".join(text_blocks).strip()
        raw = re.sub(r"^```json|```$", "", raw).strip()
        return json.loads(raw)
    except (requests.RequestException, json.JSONDecodeError, KeyError) as exc:
        logger.warning("Anthropic assistant call failed, falling back to rule-based parser: %s", exc)
        return None


def _deterministic_parse(query: str) -> dict:
    """Enhanced rule-based NLP parser: extracts genres, keywords, actors,
    directors, runtime limits, decade/year bounds, industry/language, and
    reference movie similarity ('similar to Interstellar', 'like Shutter Island')."""
    q = query.lower().strip()
    filters: dict = {
        "genres": [],
        "keywords": [],
        "year_min": None,
        "year_max": None,
        "director": None,
        "actor": None,
        "language": None,
        "industry": None,
        "max_runtime": None,
        "similar_to": None,
        "min_rating": None,
        "explanation": f"Matching movies for: \u201c{query}\u201d",
    }

    # 1. Genres
    for genre in Genre.objects.values_list("name", flat=True):
        if re.search(r"\b" + re.escape(genre.lower()) + r"\b", q):
            filters["genres"].append(genre)

    # 2. Industry / Language
    if "bollywood" in q or "hindi" in q:
        filters["industry"] = "bollywood"
        filters["language"] = "hi"
    elif "hollywood" in q:
        filters["industry"] = "hollywood"
        filters["language"] = "en"
    elif "telugu" in q:
        filters["language"] = "te"
    elif "tamil" in q:
        filters["language"] = "ta"
    elif "malayalam" in q:
        filters["language"] = "ml"

    # 3. Runtime ("less than 2 hours", "under 120 minutes", "shorter than 2h")
    hours_match = re.search(r"(?:less than|under|shorter than)\s+(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|h)\b", q)
    if hours_match:
        filters["max_runtime"] = int(float(hours_match.group(1)) * 60)
    else:
        mins_match = re.search(r"(?:less than|under|shorter than)\s+(\d+)\s*(?:minutes|mins|min)\b", q)
        if mins_match:
            filters["max_runtime"] = int(mins_match.group(1))

    # 4. Temporal constraints ("after 2018", "before 2010", "from the 2010s", "in 2020")
    after_match = re.search(r"(?:after|since|post)\s+((?:19|20)\d{2})\b", q)
    before_match = re.search(r"(?:before|prior to|until)\s+((?:19|20)\d{2})\b", q)
    if after_match:
        filters["year_min"] = int(after_match.group(1)) + 1
    if before_match:
        filters["year_max"] = int(before_match.group(1)) - 1

    decade_match = DECADE_PATTERN.search(q)
    if decade_match:
        decade_start = int(decade_match.group(0)[:4])
        filters["year_min"] = decade_start
        filters["year_max"] = decade_start + 9
    elif not filters["year_min"] and not filters["year_max"]:
        year_match = re.search(r"\b((?:19|20)\d{2})\b", query)
        if year_match:
            year = int(year_match.group(1))
            filters["year_min"] = year
            filters["year_max"] = year

    # 5. Rating cues
    if any(term in q for term in ["highly rated", "best", "top rated", "acclaimed", "masterpiece", "great"]):
        filters["min_rating"] = 7.5
    elif any(term in q for term in ["underrated", "hidden gem"]):
        filters["min_rating"] = 6.5

    # 6. Mood and thematic keywords
    mood_words = [
        "dark", "psychological", "funny", "feel-good", "heartwarming", "twisty",
        "slow-burn", "gritty", "uplifting", "romantic", "scary", "mind-bending",
        "emotional", "inspirational", "exciting", "relaxing", "sad", "chill",
    ]
    filters["keywords"] = [w for w in mood_words if w in q]
    if "feel-good" in q and "Comedy" not in filters["genres"] and not filters["genres"]:
        filters["keywords"].extend(["friendship", "laughter", "inspiration"])

    # 7. Actor extraction ("starring Aamir Khan", "with Leonardo DiCaprio")
    actor_match = re.search(r"(?:starring|with actor|featuring actor|star)\s+([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)+)", query, re.IGNORECASE)
    if actor_match:
        filters["actor"] = actor_match.group(1).strip()
    else:
        # Check against common popular actors in DB
        known_actors = [
            "Aamir Khan", "Leonardo DiCaprio", "Christian Bale", "Cillian Murphy",
            "Timothée Chalamet", "Robert Downey Jr.", "Hrithik Roshan", "Ranveer Singh",
            "Ayushmann Khurrana", "Rajkummar Rao", "Tabu", "Alia Bhatt", "Zendaya",
            "Ryan Gosling", "Yash", "Rishab Shetty"
        ]
        for act in known_actors:
            if act.lower() in q:
                filters["actor"] = act
                break

    # 8. Director extraction ("directed by Christopher Nolan", "by Christopher Nolan")
    director_match = re.search(r"(?:directed by|by director|director)\s+([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)+)", query, re.IGNORECASE)
    if director_match:
        filters["director"] = director_match.group(1).strip()
    else:
        known_directors = [
            "Christopher Nolan", "Denis Villeneuve", "James Cameron", "Martin Scorsese",
            "Rajkumar Hirani", "Zoya Akhtar", "Sriram Raghavan", "Nitesh Tiwari", "S.S. Rajamouli"
        ]
        for d in known_directors:
            if d.lower() in q:
                filters["director"] = d
                break

    # 9. Reference movie similarity ("similar to Interstellar", "like Shutter Island")
    sim_match = re.search(r"(?:similar to|movies? like|like|recommendations? for)\s+([A-Z][a-zA-Z0-9\s:]{2,30}?)(?:\s+but|\s+and|\s+with|\.|\?|$)", query, re.IGNORECASE)
    if sim_match:
        ref_title = sim_match.group(1).strip()
        # Ensure it's not a generic word like "comedy" or "something"
        if len(ref_title) > 2 and ref_title.lower() not in ["a", "an", "the", "movies", "films", "something"]:
            filters["similar_to"] = ref_title

    return filters


def _apply_filters(filters: dict, limit: int = 20):
    from apps.recommendations.engine import recommend_similar_to

    # If the user requested movies similar to a reference title, use content similarity as primary ranker
    if filters.get("similar_to"):
        ref_title = filters["similar_to"]
        seed = Movie.objects.filter(title__icontains=ref_title).first()
        if seed:
            scored = recommend_similar_to(seed, limit=30)
            qs_ids = [s.movie.id for s in scored]
            qs = Movie.objects.filter(id__in=qs_ids).prefetch_related("genres")

            if filters.get("max_runtime"):
                qs = qs.filter(runtime_minutes__lte=filters["max_runtime"])
            if filters.get("industry"):
                qs = qs.filter(industry=filters["industry"])
            if filters.get("language"):
                qs = qs.filter(original_language=filters["language"])
            if filters.get("genres"):
                qs = qs.filter(genres__name__in=filters["genres"]).distinct()

            # Preserve similarity ranking order
            ordered_movies = sorted(list(qs), key=lambda m: next((s.score for s in scored if s.movie.id == m.id), 0), reverse=True)
            return ordered_movies[:limit]

    qs = Movie.objects.prefetch_related("genres").all()

    if filters.get("industry"):
        qs = qs.filter(industry=filters["industry"])
    if filters.get("language"):
        qs = qs.filter(original_language=filters["language"])
    if filters.get("genres"):
        qs = qs.filter(genres__name__in=filters["genres"]).distinct()
    if filters.get("max_runtime"):
        qs = qs.filter(runtime_minutes__lte=filters["max_runtime"])
    if filters.get("year_min"):
        qs = qs.filter(release_date__year__gte=filters["year_min"])
    if filters.get("year_max"):
        qs = qs.filter(release_date__year__lte=filters["year_max"])
    if filters.get("director"):
        qs = qs.filter(director__icontains=filters["director"])
    if filters.get("actor"):
        qs = qs.filter(cast__icontains=filters["actor"])
    if filters.get("min_rating"):
        qs = qs.filter(imdb_rating__gte=filters["min_rating"])
    if filters.get("keywords"):
        keyword_q = Q()
        for kw in filters["keywords"]:
            keyword_q |= Q(overview__icontains=kw) | Q(keywords__icontains=kw)
        qs = qs.filter(keyword_q)

    # If over-filtered and yields 0 results, relax keywords
    if not qs.exists() and filters.get("keywords"):
        relaxed_qs = Movie.objects.prefetch_related("genres").all()
        if filters.get("genres"):
            relaxed_qs = relaxed_qs.filter(genres__name__in=filters["genres"]).distinct()
        if filters.get("industry"):
            relaxed_qs = relaxed_qs.filter(industry=filters["industry"])
        if filters.get("max_runtime"):
            relaxed_qs = relaxed_qs.filter(runtime_minutes__lte=filters["max_runtime"])
        if relaxed_qs.exists():
            return relaxed_qs.order_by("-flickrate_score", "-popularity")[:limit]

    return qs.order_by("-flickrate_score", "-popularity")[:limit]


def ask_assistant(query: str, user=None) -> dict:
    query = (query or "").strip()
    if not query:
        return {
            "mode": "none",
            "explanation": "Ask me something like \u201cShow me Hindi comedy movies released after 2018\u201d or \u201cI want movies similar to Interstellar but less than 2 hours long.\u201d",
            "filters": {},
            "results": [],
        }

    llm_filters = _call_anthropic(query)
    if llm_filters is not None:
        mode = "llm"
        filters = llm_filters
    else:
        mode = "deterministic"
        filters = _deterministic_parse(query)

    movies = _apply_filters(filters)
    return {
        "mode": mode,
        "explanation": filters.get("explanation", f"Found {len(movies)} movies matching your request."),
        "filters": filters,
        "results": MovieListSerializer(movies, many=True).data,
    }

