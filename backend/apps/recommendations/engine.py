"""Content-based, explainable movie recommendation engine.

Recommendation Score =
    0.35 x content_similarity   (TF-IDF cosine over overview + keywords)
  + 0.20 x genre_similarity     (Jaccard over genre sets)
  + 0.15 x cast_similarity      (Jaccard over top-billed cast)
  + 0.10 x director_similarity  (1.0 if same director, else 0.0)
  + 0.20 x rating_popularity    (normalized blend of flickrate_score & popularity)

This mirrors the weighting in the product spec. Every recommendation
returned by `recommend_similar_to` carries a `reasons` list so the UI can
render "Because you liked X: ✓ Similar genres ✓ Same director ..." instead
of a black box.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
from django.db.models import QuerySet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from apps.movies.models import Movie

WEIGHTS = {
    "content": 0.35,
    "genre": 0.20,
    "cast": 0.15,
    "director": 0.10,
    "rating_popularity": 0.20,
}

MIN_CANDIDATE_POOL = 500  # cap so this stays fast without a vector DB


@dataclass
class ScoredMovie:
    movie: Movie
    score: float
    reasons: list[str] = field(default_factory=list)


def _document_text(movie: Movie) -> str:
    """Flattens a movie's textual signal into one TF-IDF document."""
    genre_names = " ".join(g.name for g in movie.genres.all())
    keywords = " ".join(movie.keywords or [])
    cast = " ".join(movie.cast or [])
    return " ".join([movie.overview or "", movie.tagline or "", genre_names, keywords, cast, movie.director or ""])


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union if union else 0.0


def _rating_popularity_score(movie: Movie) -> float:
    """0-1 blend of FlickRate score and log-scaled popularity, used as a
    tie-breaker / quality prior rather than the primary similarity signal."""
    score_component = float(movie.flickrate_score) / 10.0 if movie.flickrate_score else 0.5
    pop = movie.popularity or 0.0
    pop_component = min(1.0, math.log(pop + 1, 10) / 3.0) if pop > 0 else 0.0
    return 0.7 * score_component + 0.3 * pop_component


def _candidate_pool(exclude_id: int | None = None) -> QuerySet:
    qs = Movie.objects.prefetch_related("genres")
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    return qs.order_by("-popularity")[:MIN_CANDIDATE_POOL]



def recommend_similar_to(seed_movie: Movie, limit: int = 12) -> list[ScoredMovie]:
    """Content-based 'Because you liked X' recommendations."""
    candidates = list(_candidate_pool(exclude_id=seed_movie.id))
    if not candidates:
        return []

    corpus = [_document_text(seed_movie)] + [_document_text(m) for m in candidates]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(corpus)
    content_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    seed_genres = {g.name for g in seed_movie.genres.all()}
    seed_cast = set(seed_movie.cast or [])

    results: list[ScoredMovie] = []
    for i, candidate in enumerate(candidates):
        genre_sim = _jaccard(seed_genres, {g.name for g in candidate.genres.all()})
        cast_sim = _jaccard(seed_cast, set(candidate.cast or []))
        director_sim = 1.0 if seed_movie.director and seed_movie.director == candidate.director else 0.0
        rating_pop = _rating_popularity_score(candidate)
        content_sim = float(content_sims[i])

        total = (
            WEIGHTS["content"] * content_sim
            + WEIGHTS["genre"] * genre_sim
            + WEIGHTS["cast"] * cast_sim
            + WEIGHTS["director"] * director_sim
            + WEIGHTS["rating_popularity"] * rating_pop
        )

        reasons = []
        if genre_sim >= 0.3:
            reasons.append("Similar genres")
        if director_sim == 1.0:
            reasons.append("Same director")
        if cast_sim > 0:
            reasons.append("Shares cast members")
        if content_sim >= 0.15:
            reasons.append("Similar themes and plot")
        if candidate.flickrate_score and candidate.flickrate_score >= 7.5:
            reasons.append("Highly rated")
        if not reasons:
            reasons.append("Matches your taste profile")

        results.append(ScoredMovie(movie=candidate, score=round(total, 4), reasons=reasons))

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:limit]


def recommend_for_user(user, limit: int = 20) -> list[ScoredMovie]:
    """Personalized recommendations for an authenticated user.

    Builds a 'taste profile' from the user's highly-rated reviews (>=7/10)
    and watchlist, then averages the content-based recommendations seeded
    from each of those movies. Falls back to popular picks for new users
    with no signal yet.
    """
    from apps.reviews.models import Review
    from apps.watchlist.models import WatchlistEntry

    liked_movie_ids = list(
        Review.objects.filter(user=user, rating__gte=7).values_list("movie_id", flat=True)
    ) + list(
        WatchlistEntry.objects.filter(user=user).values_list("movie_id", flat=True)
    )
    liked_movie_ids = list(dict.fromkeys(liked_movie_ids))[:10]  # de-dupe, cap for perf

    if not liked_movie_ids:
        # New user: popular picks, clearly labeled as such by the caller.
        candidates = Movie.objects.order_by("-flickrate_score", "-popularity")[:limit]
        return [ScoredMovie(movie=m, score=_rating_popularity_score(m), reasons=["Popular pick for you"]) for m in candidates]

    aggregated: dict[int, ScoredMovie] = {}
    seed_movies = Movie.objects.filter(id__in=liked_movie_ids).prefetch_related("genres")

    already_seen = set(liked_movie_ids)
    for seed in seed_movies:
        for scored in recommend_similar_to(seed, limit=30):
            if scored.movie.id in already_seen:
                continue
            existing = aggregated.get(scored.movie.id)
            if existing is None or scored.score > existing.score:
                scored.reasons = [f"Because you liked {seed.title}"] + scored.reasons
                aggregated[scored.movie.id] = scored

    ranked = sorted(aggregated.values(), key=lambda r: r.score, reverse=True)
    return ranked[:limit]


MOOD_PROFILES = {
    "happy": {
        "label": "Happy",
        "genres": ["Comedy", "Animation", "Family", "Adventure"],
        "keywords": ["feel-good", "friendship", "laughter", "happy", "joy", "cheerful"],
        "tone": "uplifting, lighthearted, and heartwarming",
    },
    "sad": {
        "label": "Sad",
        "genres": ["Drama", "Romance"],
        "keywords": ["tragedy", "emotional", "loss", "grief", "heartbreaking", "tears"],
        "tone": "poignant, melancholic, and deeply moving",
    },
    "romantic": {
        "label": "Romantic",
        "genres": ["Romance", "Drama", "Comedy"],
        "keywords": ["love", "relationship", "couple", "passion", "soulmates", "romance"],
        "tone": "tender, intimate, and passionate",
    },
    "exciting": {
        "label": "Exciting",
        "genres": ["Action", "Adventure", "Thriller", "Science Fiction"],
        "keywords": ["adrenaline", "spectacle", "fast-paced", "heist", "superhero", "explosive"],
        "tone": "high-octane, thrilling, and action-packed",
    },
    "scary": {
        "label": "Scary",
        "genres": ["Horror", "Thriller", "Mystery"],
        "keywords": ["ghost", "curse", "terror", "creepy", "monsters", "haunted", "dark"],
        "tone": "spine-chilling, suspenseful, and frightening",
    },
    "relaxing": {
        "label": "Relaxing",
        "genres": ["Animation", "Comedy", "Drama", "Adventure"],
        "keywords": ["road trip", "calm", "peaceful", "nature", "gentle", "feel-good"],
        "tone": "soothing, tranquil, and comforting",
    },
    "inspirational": {
        "label": "Inspirational",
        "genres": ["Biography", "Drama", "History", "Sport"],
        "keywords": ["triumph", "perseverance", "underdog", "hero", "true story", "achievement"],
        "tone": "motivating, empowering, and life-affirming",
    },
    "mind-bending": {
        "label": "Mind-bending",
        "genres": ["Science Fiction", "Mystery", "Thriller"],
        "keywords": ["plot twist", "dream", "subconscious", "reality", "time travel", "paradox", "psychological"],
        "tone": "cerebral, twisty, and perception-shifting",
    },
    "emotional": {
        "label": "Emotional",
        "genres": ["Drama", "Family", "Romance"],
        "keywords": ["father daughter", "sacrifice", "family", "compassion", "moving", "tearjerker"],
        "tone": "deeply touching, heartfelt, and tearful",
    },
    "funny": {
        "label": "Funny",
        "genres": ["Comedy"],
        "keywords": ["satire", "laughter", "buddy comedy", "parody", "humor", "slapstick"],
        "tone": "hilarious, witty, and laugh-out-loud funny",
    },
}


def recommend_by_mood(mood_key: str, limit: int = 16) -> list[ScoredMovie]:
    """Returns movies curated and ranked for a specific emotional mood.

    Blends genre overlap, mood keyword matching via TF-IDF cosine similarity,
    and quality prior (FlickRate score).
    """
    profile = MOOD_PROFILES.get(mood_key.lower().strip())
    if not profile:
        profile = MOOD_PROFILES["happy"]  # fallback default

    target_genres = set(profile["genres"])
    target_keywords = profile["keywords"]
    target_text = f"{profile['label']} {' '.join(profile['genres'])} {' '.join(target_keywords)} {profile['tone']}"

    candidates = list(Movie.objects.prefetch_related("genres").all())
    if not candidates:
        return []

    corpus = [target_text] + [_document_text(m) for m in candidates]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=3000)
    tfidf_matrix = vectorizer.fit_transform(corpus)
    content_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    results: list[ScoredMovie] = []
    for i, candidate in enumerate(candidates):
        cand_genres = {g.name for g in candidate.genres.all()}
        genre_overlap = _jaccard(target_genres, cand_genres)
        content_sim = float(content_sims[i])
        quality_score = _rating_popularity_score(candidate)

        total = 0.40 * content_sim + 0.35 * genre_overlap + 0.25 * quality_score

        reasons = []
        if genre_overlap >= 0.25:
            reasons.append(f"Classic {profile['label']} genre mix")
        if content_sim >= 0.10:
            reasons.append(f"Matches {profile['label']} tone")
        if candidate.flickrate_score and candidate.flickrate_score >= 8.0:
            reasons.append("Highly acclaimed")
        if not reasons:
            reasons.append(f"Curated for {profile['label']} mood")

        results.append(ScoredMovie(movie=candidate, score=round(total, 4), reasons=reasons))

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:limit]

