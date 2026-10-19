"""
python manage.py seed_movies

Populates the database with a verified, authentic catalog of iconic Hollywood
and Bollywood cinema (Interstellar, Inception, The Dark Knight, Oppenheimer,
Dune, 3 Idiots, Dangal, Lagaan, PK, ZNMD, Gully Boy, Andhadhun, Stree, etc.).

If TMDB_API_KEY is configured in backend/.env, the command also fetches live
batches of movies from TMDB (Hollywood, Bollywood, regional cinema, etc.)
and enriches them with OMDb ratings.
"""
from datetime import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.movies.fixtures.seed_catalog import BASELINE_MOVIES
try:
    from apps.movies.fixtures.expanded_catalog import EXPANDED_MOVIES
except ImportError:
    EXPANDED_MOVIES = []

ALL_CATALOG_MOVIES = BASELINE_MOVIES + EXPANDED_MOVIES
from apps.movies.models import Movie, Genre
from apps.movies.services.scoring import compute_flickrate_score
from apps.movies.services.tmdb import tmdb_client
from apps.movies.services.ingest import ingest_tmdb_movie

SEED_QUERIES = [
    {"label": "Hollywood — popular", "params": {"sort_by": "popularity.desc", "with_original_language": "en"}},
    {"label": "Hollywood — classics", "params": {"sort_by": "vote_average.desc", "vote_count.gte": 5000, "primary_release_date.lte": "2005-12-31"}},
    {"label": "Bollywood — popular", "params": {"sort_by": "popularity.desc", "with_original_language": "hi"}},
    {"label": "Telugu cinema", "params": {"sort_by": "popularity.desc", "with_original_language": "te"}},
    {"label": "Tamil cinema", "params": {"sort_by": "popularity.desc", "with_original_language": "ta"}},
    {"label": "Malayalam cinema", "params": {"sort_by": "popularity.desc", "with_original_language": "ml"}},
    {"label": "Sci-Fi", "params": {"sort_by": "popularity.desc", "with_genres": 878}},
    {"label": "Horror", "params": {"sort_by": "popularity.desc", "with_genres": 27}},
    {"label": "Animation", "params": {"sort_by": "popularity.desc", "with_genres": 16}},
    {"label": "Drama", "params": {"sort_by": "popularity.desc", "with_genres": 18}},
]


class Command(BaseCommand):
    help = "Seed the database with verified authentic movies and optional live TMDB data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-query", type=int, default=10,
            help="How many movies to ingest per seed query when TMDB is active (default: 10)."
        )
        parser.add_argument(
            "--skip-baseline", action="store_true",
            help="Skip seeding the baseline Hollywood & Bollywood catalog."
        )

    def handle(self, *args, **options):
        # 1. Seed verified baseline catalog
        if not options["skip_baseline"]:
            self.stdout.write(self.style.NOTICE("Seeding authentic Hollywood & Bollywood baseline catalog..."))
            seeded_count = 0
            for item in ALL_CATALOG_MOVIES:
                release_date = None
                if item.get("release_date"):
                    try:
                        release_date = datetime.strptime(item["release_date"], "%Y-%m-%d").date()
                    except ValueError:
                        pass

                flickrate_calc = compute_flickrate_score(
                    imdb_rating=item.get("imdb_rating"),
                    rotten_tomatoes=item.get("rotten_tomatoes_rating"),
                    user_rating_avg=None,
                    popularity=item.get("popularity", 100.0),
                )

                movie, _created = Movie.objects.update_or_create(
                    tmdb_id=item["tmdb_id"],
                    defaults=dict(
                        imdb_id=item.get("imdb_id", ""),
                        title=item["title"],
                        original_title=item.get("original_title", item["title"]),
                        tagline=item.get("tagline", ""),
                        overview=item.get("overview", ""),
                        release_date=release_date,
                        runtime_minutes=item.get("runtime_minutes"),
                        original_language=item.get("original_language", "en"),
                        spoken_languages=item.get("spoken_languages", []),
                        country=item.get("country", ""),
                        industry=item.get("industry", "hollywood"),
                        poster_path=item.get("poster_path", ""),
                        backdrop_path=item.get("backdrop_path", ""),
                        trailer_youtube_key=item.get("trailer_youtube_key", ""),
                        director=item.get("director", ""),
                        cast=item.get("cast", []),
                        keywords=item.get("keywords", []),
                        imdb_rating=Decimal(str(item["imdb_rating"])) if item.get("imdb_rating") else None,
                        imdb_votes=item.get("imdb_votes"),
                        rotten_tomatoes_rating=item.get("rotten_tomatoes_rating"),
                        flickrate_score=flickrate_calc,
                        popularity=item.get("popularity", 100.0),
                    )
                )

                genre_objs = []
                for g_name in item.get("genres", []):
                    g_obj, _ = Genre.objects.get_or_create(name=g_name)
                    genre_objs.append(g_obj)
                movie.genres.set(genre_objs)

                seeded_count += 1
                self.stdout.write(f"  [+] {movie.title} ({movie.year}) - Industry: {movie.industry}")

            self.stdout.write(self.style.SUCCESS(f"Successfully seeded {seeded_count} authentic baseline movies."))

        # 2. Ingest live TMDB catalog if configured
        if not tmdb_client.is_configured:
            self.stdout.write(self.style.WARNING(
                "\nNote: TMDB_API_KEY is not set in backend/.env. The app is fully operational with the "
                "authentic baseline catalog. To expand the catalog with live TMDB sync, set TMDB_API_KEY and re-run."
            ))
            return

        per_query = options["per_query"]
        total_ingested = 0
        self.stdout.write(self.style.NOTICE("\nFetching live movie updates from TMDB API..."))

        for seed in SEED_QUERIES:
            self.stdout.write(f"Fetching: {seed['label']}...")
            results = tmdb_client.discover(**seed["params"])[:per_query]
            if not results:
                self.stdout.write(self.style.WARNING(f"  No results for {seed['label']} (TMDB may be unreachable)."))
                continue

            for r in results:
                movie = ingest_tmdb_movie(r["id"])
                if movie:
                    total_ingested += 1
                    self.stdout.write(f"  [+] {movie.title} ({movie.year})")
                else:
                    self.stdout.write(self.style.WARNING(f"  [-] Failed to ingest TMDB id {r['id']}"))


        self.stdout.write(self.style.SUCCESS(
            f"Done. Ingested/updated {total_ingested} additional live movies across {len(SEED_QUERIES)} shelves."
        ))

