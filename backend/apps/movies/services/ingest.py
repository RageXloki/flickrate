"""Turns raw TMDB (+ optional OMDb) payloads into `Movie` rows.

Kept separate from views/management commands so both the seed command and
any on-demand "fetch if missing" code path share one source of truth.
"""
from datetime import datetime

from django.db import transaction

from apps.movies.models import Movie, Genre
from apps.movies.services.tmdb import tmdb_client
from apps.movies.services.omdb import omdb_client
from apps.movies.services.scoring import compute_flickrate_score

INDIAN_LANGUAGES = {
    "hi": Movie.Industry.BOLLYWOOD,
    "te": Movie.Industry.INDIAN_REGIONAL,
    "ta": Movie.Industry.INDIAN_REGIONAL,
    "ml": Movie.Industry.INDIAN_REGIONAL,
    "kn": Movie.Industry.INDIAN_REGIONAL,
    "bn": Movie.Industry.INDIAN_REGIONAL,
    "mr": Movie.Industry.INDIAN_REGIONAL,
    "pa": Movie.Industry.INDIAN_REGIONAL,
}


def _infer_industry(original_language: str, origin_country: list[str]) -> str:
    if original_language in INDIAN_LANGUAGES:
        return INDIAN_LANGUAGES[original_language]
    if "US" in (origin_country or []) or "GB" in (origin_country or []):
        return Movie.Industry.HOLLYWOOD
    return Movie.Industry.OTHER


@transaction.atomic
def ingest_tmdb_movie(tmdb_id: int) -> Movie | None:
    """Fetches full details for a single TMDB movie id, enriches with OMDb,
    and upserts a `Movie` row. Returns None if TMDB has nothing (e.g. bad
    id or TMDB is unreachable) -- callers should handle that gracefully."""

    details = tmdb_client.movie_details(tmdb_id)
    if not details:
        return None

    imdb_id = (details.get("external_ids") or {}).get("imdb_id") or details.get("imdb_id") or ""
    omdb_payload = omdb_client.by_imdb_id(imdb_id) if imdb_id else None
    omdb_ratings = omdb_client.extract_ratings(omdb_payload)

    credits = details.get("credits") or {}
    cast_names = [c["name"] for c in credits.get("cast", [])[:12]]
    cast_details = [
        {
            "id": c.get("id"),
            "name": c.get("name"),
            "character": c.get("character", ""),
            "profile_path": c.get("profile_path") or "",
        }
        for c in credits.get("cast", [])[:12]
    ]

    crew_list = credits.get("crew", [])
    director = next((c["name"] for c in crew_list if c.get("job") == "Director"), "")
    writers = [c["name"] for c in crew_list if c.get("job") in ("Screenplay", "Writer", "Story")][:4]
    crew_details = [
        {
            "name": c.get("name"),
            "job": c.get("job", ""),
            "department": c.get("department", ""),
        }
        for c in crew_list
        if c.get("job") in ("Director", "Screenplay", "Writer", "Producer", "Director of Photography", "Original Music Composer")
    ][:10]

    production_companies = [p.get("name") for p in details.get("production_companies", [])]
    keywords = [k["name"] for k in (details.get("keywords") or {}).get("keywords", [])]
    trailer_key = tmdb_client.official_trailer_key(details.get("videos"))

    raw_videos = (details.get("videos") or {}).get("results", [])
    videos = [
        {
            "key": v.get("key"),
            "name": v.get("name", "Video"),
            "site": v.get("site", "YouTube"),
            "type": v.get("type", "Trailer"),
            "official": v.get("official", False),
        }
        for v in raw_videos
        if v.get("site") == "YouTube"
    ][:8]

    critic_reviews = [
        {
            "author": r.get("author", "Verified Critic"),
            "publication": "TMDB Reviewer",
            "content": r.get("content", ""),
            "url": r.get("url", ""),
            "date": (r.get("created_at") or "")[:10],
        }
        for r in (details.get("reviews") or {}).get("results", [])[:6]
    ]

    external_links = {
        "imdb": f"https://www.imdb.com/title/{imdb_id}" if imdb_id else "",
        "tmdb": f"https://www.themoviedb.org/movie/{tmdb_id}",
        "homepage": details.get("homepage", ""),
    }

    release_date = None
    if details.get("release_date"):
        try:
            release_date = datetime.strptime(details["release_date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    origin_country = details.get("origin_country") or details.get("production_countries", [])
    origin_country_codes = (
        origin_country if origin_country and isinstance(origin_country[0], str)
        else [c.get("iso_3166_1") for c in origin_country]
    )

    budget = details.get("budget") or None
    revenue = details.get("revenue") or omdb_ratings.get("box_office") or None

    movie, _created = Movie.objects.update_or_create(
        tmdb_id=tmdb_id,
        defaults=dict(
            imdb_id=imdb_id,
            title=details.get("title", ""),
            original_title=details.get("original_title", ""),
            tagline=details.get("tagline", ""),
            overview=details.get("overview", ""),
            release_date=release_date,
            runtime_minutes=details.get("runtime"),
            original_language=details.get("original_language", ""),
            spoken_languages=[l.get("english_name") for l in details.get("spoken_languages", [])],
            country=(origin_country_codes[0] if origin_country_codes else ""),
            industry=_infer_industry(details.get("original_language", ""), origin_country_codes),
            poster_path=details.get("poster_path") or "",
            backdrop_path=details.get("backdrop_path") or "",
            trailer_youtube_key=trailer_key,
            director=director,
            writers=writers,
            cast=cast_names,
            cast_details=cast_details,
            crew_details=crew_details,
            production_companies=production_companies,
            keywords=keywords,
            certification=omdb_ratings.get("rated") or "",
            budget=budget,
            revenue=revenue,
            awards=omdb_ratings.get("awards") or "",
            videos=videos,
            external_links=external_links,
            critic_reviews=critic_reviews,
            imdb_rating=omdb_ratings["imdb_rating"],
            imdb_votes=omdb_ratings["imdb_votes"],
            rotten_tomatoes_rating=omdb_ratings["rotten_tomatoes"],
            metascore=omdb_ratings.get("metascore"),
            popularity=details.get("popularity", 0.0),
        ),
    )

    genre_objs = []
    for g in details.get("genres", []):
        genre_obj, _ = Genre.objects.get_or_create(tmdb_id=g["id"], defaults={"name": g["name"]})
        genre_objs.append(genre_obj)
    movie.genres.set(genre_objs)

    recompute_flickrate_score(movie)
    return movie


def recompute_flickrate_score(movie: Movie) -> Movie:
    from django.db.models import Avg
    from apps.reviews.models import Review  # local import avoids app-loading cycle

    user_avg = Review.objects.filter(movie=movie).aggregate(avg=Avg("rating"))["avg"]

    movie.flickrate_score = compute_flickrate_score(
        imdb_rating=float(movie.imdb_rating) if movie.imdb_rating is not None else None,
        rotten_tomatoes=movie.rotten_tomatoes_rating,
        user_rating_avg=user_avg,
        popularity=movie.popularity,
    )
    movie.save(update_fields=["flickrate_score"])
    return movie
