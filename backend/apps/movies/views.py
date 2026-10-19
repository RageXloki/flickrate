from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters as drf_filters
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import MovieFilter
from .models import Movie, Genre, MovieInteraction, SearchHistory
from .serializers import MovieListSerializer, MovieDetailSerializer, GenreSerializer
from .services.ingest import ingest_tmdb_movie
from .services.tmdb import tmdb_client


SORT_MAP = {
    "popularity": "-popularity",
    "newest": "-release_date",
    "imdb": "-imdb_rating",
    "rotten_tomatoes": "-rotten_tomatoes_rating",
    "flickrate": "-flickrate_score",
}


class MovieListView(generics.ListAPIView):
    """GET /api/movies/  — search, filter, sort, paginate."""

    serializer_class = MovieListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = MovieFilter

    search_fields = ["title", "original_title", "director", "cast", "keywords"]

    def get_queryset(self):
        qs = Movie.objects.prefetch_related("genres").all()
        sort = self.request.query_params.get("sort", "popularity")
        qs = qs.order_by(SORT_MAP.get(sort, "-popularity"))
        return qs


class MovieDetailView(generics.RetrieveAPIView):
    """GET /api/movies/:id/

    If the movie isn't in our DB yet but a numeric tmdb_id-looking id is
    requested and TMDB is configured, we lazily ingest it on first view.
    """

    serializer_class = MovieDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Movie.objects.prefetch_related("genres")

    def get_object(self):
        movie_id = self.kwargs["pk"]
        try:
            return super().get_object()
        except Exception:
            if tmdb_client.is_configured:
                movie = ingest_tmdb_movie(movie_id)
                if movie:
                    return movie
            raise


class MovieSearchView(APIView):
    """GET /api/movies/search/?q=...

    Autocomplete-friendly: searches local DB across title, actor, director,
    genre, keyword. Falls back to a live TMDB search (results not yet
    ingested) when the local catalog has too few matches, so search still
    feels 'full' even on a freshly-seeded database.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "search"

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"local_results": [], "tmdb_suggestions": []})

        local_qs = Movie.objects.filter(
            Q(title__icontains=query)
            | Q(director__icontains=query)
            | Q(cast__icontains=query)
            | Q(genres__name__icontains=query)
            | Q(keywords__icontains=query)
        ).distinct().order_by("-popularity")[:20]

        user = request.user if request.user.is_authenticated else None
        SearchHistory.objects.create(user=user, query=query, results_count=local_qs.count())


        tmdb_suggestions = []
        if local_qs.count() < 5 and tmdb_client.is_configured:
            live = tmdb_client.search(query)
            tmdb_suggestions = [
                {
                    "tmdb_id": r["id"],
                    "title": r.get("title"),
                    "year": (r.get("release_date") or "")[:4],
                    "poster_url": tmdb_client.image_url(r.get("poster_path"), "w185"),
                }
                for r in live.get("results", [])[:10]
            ]

        return Response({
            "local_results": MovieListSerializer(local_qs, many=True).data,
            "tmdb_suggestions": tmdb_suggestions,
        })


class TrendingView(APIView):
    """GET /api/movies/trending/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Movie.objects.order_by("-popularity")[:20]
        return Response(MovieListSerializer(qs, many=True).data)


class PopularView(APIView):
    """GET /api/movies/popular/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Movie.objects.order_by("-flickrate_score", "-popularity")[:20]
        return Response(MovieListSerializer(qs, many=True).data)


class GenreListView(generics.ListAPIView):
    """GET /api/movies/genres/"""

    permission_classes = [permissions.AllowAny]
    serializer_class = GenreSerializer
    queryset = Genre.objects.all()


class MovieTrailerView(APIView):
    """GET /api/movies/:id/trailer/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            movie = Movie.objects.get(pk=pk)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        if not movie.trailer_youtube_key:
            return Response({"available": False, "url": None})
        return Response({
            "available": True,
            "url": f"https://www.youtube.com/watch?v={movie.trailer_youtube_key}",
        })


class TrackInteractionView(APIView):
    """POST /api/movies/:id/interact/  body: {kind: 'view'|'like'|'click'}"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        kind = request.data.get("kind", "view")
        if kind not in MovieInteraction.Kind.values:
            return Response({"detail": "Invalid interaction kind."}, status=400)
        try:
            movie = Movie.objects.get(pk=pk)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        MovieInteraction.objects.create(user=request.user, movie=movie, kind=kind)
        return Response(status=201)


class TopRatedView(APIView):
    """GET /api/movies/top-rated/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Movie.objects.filter(flickrate_score__isnull=False).order_by("-flickrate_score", "-popularity")[:20]
        return Response(MovieListSerializer(qs, many=True).data)


class NewReleasesView(APIView):
    """GET /api/movies/new-releases/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Movie.objects.filter(release_date__isnull=False).order_by("-release_date")[:20]
        return Response(MovieListSerializer(qs, many=True).data)


class BollywoodView(APIView):
    """GET /api/movies/bollywood/ — Dedicated Bollywood and Indian Cinema showcase."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        b_qs = Movie.objects.filter(industry=Movie.Industry.BOLLYWOOD)
        r_qs = Movie.objects.filter(industry=Movie.Industry.INDIAN_REGIONAL)

        trending = b_qs.order_by("-popularity")[:12]
        top_rated = b_qs.filter(flickrate_score__isnull=False).order_by("-flickrate_score")[:12]
        recent = b_qs.filter(release_date__isnull=False).order_by("-release_date")[:12]
        classics = b_qs.filter(release_date__year__lte=2012).order_by("-flickrate_score")[:12]
        regional = r_qs.order_by("-popularity")[:12]

        return Response({
            "trending": MovieListSerializer(trending, many=True).data,
            "top_rated": MovieListSerializer(top_rated, many=True).data,
            "recent": MovieListSerializer(recent, many=True).data,
            "classics": MovieListSerializer(classics, many=True).data,
            "regional": MovieListSerializer(regional, many=True).data,
            "featured_actors": [
                {"name": "Aamir Khan", "role": "Actor / Director", "hits": ["3 Idiots", "Dangal", "Lagaan", "PK", "Taare Zameen Par"]},
                {"name": "Hrithik Roshan", "role": "Actor", "hits": ["Zindagi Na Milegi Dobara", "War", "Super 30"]},
                {"name": "Ranveer Singh", "role": "Actor", "hits": ["Gully Boy", "Padmaavat", "Bajirao Mastani"]},
                {"name": "Ayushmann Khurrana", "role": "Actor", "hits": ["Andhadhun", "Article 15", "Badhaai Ho"]},
                {"name": "Rajkummar Rao", "role": "Actor", "hits": ["Stree", "Stree 2", "Newton", "Bareilly Ki Barfi"]},
                {"name": "Tabu", "role": "Actress", "hits": ["Andhadhun", "Drishyam", "Haider"]},
                {"name": "Alia Bhatt", "role": "Actress", "hits": ["Gully Boy", "RRR", "Raazi", "Gangubai Kathiawadi"]},
            ],
            "featured_directors": [
                {"name": "Rajkumar Hirani", "movies": ["3 Idiots", "PK", "Munna Bhai M.B.B.S."]},
                {"name": "Zoya Akhtar", "movies": ["Zindagi Na Milegi Dobara", "Gully Boy", "Dil Dhadakne Do"]},
                {"name": "Sriram Raghavan", "movies": ["Andhadhun", "Badlapur", "Johnny Gaddaar"]},
                {"name": "Nitesh Tiwari", "movies": ["Dangal", "Chhichhore"]},
                {"name": "S.S. Rajamouli", "movies": ["RRR", "Baahubali: The Beginning", "Baahubali 2: The Conclusion"]},
                {"name": "Amar Kaushik", "movies": ["Stree", "Stree 2", "Bhediya"]},
            ]
        })


class HollywoodView(APIView):
    """GET /api/movies/hollywood/ — Dedicated Hollywood showcase."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        h_qs = Movie.objects.filter(industry=Movie.Industry.HOLLYWOOD)

        trending = h_qs.order_by("-popularity")[:12]
        top_rated = h_qs.filter(flickrate_score__isnull=False).order_by("-flickrate_score")[:12]
        recent = h_qs.filter(release_date__isnull=False).order_by("-release_date")[:12]
        classics = h_qs.filter(release_date__year__lte=2010).order_by("-flickrate_score")[:12]

        return Response({
            "trending": MovieListSerializer(trending, many=True).data,
            "top_rated": MovieListSerializer(top_rated, many=True).data,
            "recent": MovieListSerializer(recent, many=True).data,
            "classics": MovieListSerializer(classics, many=True).data,
            "featured_actors": [
                {"name": "Leonardo DiCaprio", "movies": ["Inception", "Titanic", "Shutter Island", "The Revenant"]},
                {"name": "Christian Bale", "movies": ["The Dark Knight", "American Psycho", "The Prestige"]},
                {"name": "Cillian Murphy", "movies": ["Oppenheimer", "Inception", "The Dark Knight"]},
                {"name": "Timothée Chalamet", "movies": ["Dune", "Dune: Part Two", "Interstellar"]},
                {"name": "Robert Downey Jr.", "movies": ["Oppenheimer", "Avengers: Endgame", "Iron Man"]},
                {"name": "Zendaya", "movies": ["Dune", "Dune: Part Two", "Spider-Man: No Way Home"]},
                {"name": "Ryan Gosling", "movies": ["Blade Runner 2049", "La La Land", "Drive"]},
            ],
            "featured_directors": [
                {"name": "Christopher Nolan", "movies": ["Oppenheimer", "Interstellar", "Inception", "The Dark Knight"]},
                {"name": "Denis Villeneuve", "movies": ["Dune", "Dune: Part Two", "Blade Runner 2049", "Arrival"]},
                {"name": "James Cameron", "movies": ["Avatar", "Titanic", "Terminator 2: Judgment Day"]},
                {"name": "Martin Scorsese", "movies": ["Shutter Island", "The Wolf of Wall Street", "Taxi Driver"]},
                {"name": "Francis Ford Coppola", "movies": ["The Godfather", "Apocalypse Now"]},
            ]
        })


class RateMovieView(APIView):
    """POST /api/movies/:id/rate/
    body: { rating: 1..10, title?: string, body?: string }
    Rates a movie directly and triggers transparent FlickRate score recomputation.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from apps.reviews.models import Review
        from apps.movies.services.ingest import recompute_flickrate_score

        try:
            movie = Movie.objects.get(pk=pk)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        raw_rating = request.data.get("rating")
        try:
            rating_val = int(raw_rating)
            if rating_val < 1 or rating_val > 10:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"detail": "Rating must be an integer between 1 and 10."}, status=400)

        title = request.data.get("title", "")
        body = request.data.get("body", "")

        review, _created = Review.objects.update_or_create(
            user=request.user,
            movie=movie,
            defaults=dict(
                rating=rating_val,
                title=title,
                body=body,
            )
        )

        recompute_flickrate_score(movie)
        movie.refresh_from_db()

        return Response({
            "detail": "Rating submitted successfully.",
            "rating": review.rating,
            "flickrate_score": movie.flickrate_score,
            "review_id": review.id,
        })


# --- Admin Dashboard Endpoints ---

class AdminStatsView(APIView):
    """GET /api/movies/admin/stats/ — Platform telemetry, counts, and top metrics."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models import Count, Avg
        from apps.reviews.models import Review
        from apps.watchlist.models import WatchlistEntry

        User = get_user_model()

        total_users = User.objects.count()
        total_movies = Movie.objects.count()
        total_reviews = Review.objects.count()
        total_ratings = Review.objects.filter(rating__isnull=False).count()
        total_watchlist = WatchlistEntry.objects.count()

        most_viewed = (
            Movie.objects.annotate(views=Count("interactions"))
            .order_by("-views", "-popularity")[:5]
        )
        most_rated = (
            Movie.objects.annotate(review_count=Count("reviews"))
            .order_by("-review_count", "-flickrate_score")[:5]
        )

        # Genre counts
        genre_distribution = (
            Genre.objects.annotate(movie_count=Count("movies"))
            .order_by("-movie_count")[:10]
            .values("id", "name", "movie_count")
        )

        industry_counts = {
            "hollywood": Movie.objects.filter(industry=Movie.Industry.HOLLYWOOD).count(),
            "bollywood": Movie.objects.filter(industry=Movie.Industry.BOLLYWOOD).count(),
            "indian_regional": Movie.objects.filter(industry=Movie.Industry.INDIAN_REGIONAL).count(),
            "other": Movie.objects.filter(industry=Movie.Industry.OTHER).count(),
        }

        recent_searches = list(SearchHistory.objects.values("query", "results_count", "created_at")[:10])

        return Response({
            "metrics": {
                "total_users": total_users,
                "total_movies": total_movies,
                "total_reviews": total_reviews,
                "total_ratings": total_ratings,
                "total_watchlist": total_watchlist,
            },
            "industry_distribution": industry_counts,
            "genre_distribution": list(genre_distribution),
            "most_viewed": MovieListSerializer(most_viewed, many=True).data,
            "most_rated": MovieListSerializer(most_rated, many=True).data,
            "recent_searches": recent_searches,
        })


class AdminUsersView(APIView):
    """GET /api/movies/admin/users/ — User list with activity summaries."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models import Count
        User = get_user_model()

        users = User.objects.annotate(
            reviews_count=Count("reviews", distinct=True),
            watchlist_count=Count("watchlist_entries", distinct=True)
        ).order_by("-date_joined")[:50]

        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "date_joined": u.date_joined,
                "is_staff": u.is_staff,
                "reviews_count": u.reviews_count,
                "watchlist_count": u.watchlist_count,
            }
            for u in users
        ]
        return Response(data)


class AdminReviewsView(APIView):
    """GET /api/movies/admin/reviews/ and DELETE /api/movies/admin/reviews/:id/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.reviews.models import Review
        reviews = Review.objects.select_related("user", "movie").order_by("-created_at")[:50]
        data = [
            {
                "id": r.id,
                "movie_id": r.movie.id,
                "movie_title": r.movie.title,
                "username": r.user.username,
                "rating": r.rating,
                "title": r.title,
                "body": r.body,
                "helpful_count": r.helpful_count,
                "created_at": r.created_at,
            }
            for r in reviews
        ]
        return Response(data)

    def delete(self, request, pk):
        from apps.reviews.models import Review
        from apps.movies.services.ingest import recompute_flickrate_score
        try:
            review = Review.objects.get(pk=pk)
            movie = review.movie
            review.delete()
            recompute_flickrate_score(movie)
            return Response({"detail": "Review deleted successfully by admin."})
        except Review.DoesNotExist:
            return Response({"detail": "Review not found."}, status=404)


class AdminSyncMovieView(APIView):
    """POST /api/movies/admin/sync/
    body: { tmdb_id: number }
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tmdb_id = request.data.get("tmdb_id")
        if not tmdb_id:
            return Response({"detail": "tmdb_id is required."}, status=400)

        if not tmdb_client.is_configured:
            return Response({
                "detail": "TMDB_API_KEY is not configured on the server. Please add your TMDB key to backend/.env."
            }, status=503)

        movie = ingest_tmdb_movie(int(tmdb_id))
        if not movie:
            return Response({"detail": f"Could not ingest TMDB ID {tmdb_id}. Please verify the ID."}, status=404)

        return Response({
            "detail": f"Successfully ingested '{movie.title}' ({movie.year}).",
            "movie": MovieDetailSerializer(movie, context={"request": request}).data,
        })


class PersonDetailView(APIView):
    """GET /api/movies/person/<name>/ — Returns actor/director filmography and bio information."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, name):
        import urllib.parse
        decoded_name = urllib.parse.unquote(name).strip()

        directed = Movie.objects.filter(director__iexact=decoded_name).order_by("-release_date")
        acted = Movie.objects.filter(cast__icontains=decoded_name).order_by("-release_date")
        all_movies = (directed | acted).distinct().order_by("-popularity")

        roles = []
        if directed.exists():
            roles.append("Director")
        if acted.exists():
            roles.append("Actor")
        if not roles:
            roles.append("Film Personality")

        # Try to extract character photo from cast_details of any of their movies
        profile_image = ""
        for m in all_movies:
            for c in (m.cast_details or []):
                if c.get("name", "").lower() == decoded_name.lower() and c.get("profile_path"):
                    profile_image = f"{settings.TMDB_IMAGE_BASE_URL}/w300{c['profile_path']}"
                    break
            if profile_image:
                break

        return Response({
            "name": decoded_name,
            "roles": roles,
            "profile_image": profile_image,
            "total_credits": all_movies.count(),
            "directing_credits": MovieListSerializer(directed, many=True).data,
            "acting_credits": MovieListSerializer(acted, many=True).data,
            "top_works": MovieListSerializer(all_movies[:10], many=True).data,
        })


class RegionalCinemaView(APIView):
    """GET /api/movies/regional/ — Comprehensive Indian regional cinema showcase."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        reg_qs = Movie.objects.filter(industry=Movie.Industry.INDIAN_REGIONAL)
        
        trending = reg_qs.order_by("-popularity")[:12]
        top_rated = reg_qs.filter(flickrate_score__isnull=False).order_by("-flickrate_score")[:12]
        recent = reg_qs.filter(release_date__isnull=False).order_by("-release_date")[:12]

        tamil = Movie.objects.filter(Q(original_language__iexact="ta") | Q(overview__icontains="Tamil")).order_by("-popularity")[:10]
        telugu = Movie.objects.filter(Q(original_language__iexact="te") | Q(overview__icontains="Telugu")).order_by("-popularity")[:10]
        malayalam = Movie.objects.filter(Q(original_language__iexact="ml") | Q(overview__icontains="Malayalam")).order_by("-popularity")[:10]
        kannada = Movie.objects.filter(Q(original_language__iexact="kn") | Q(overview__icontains="Kannada")).order_by("-popularity")[:10]

        return Response({
            "trending": MovieListSerializer(trending, many=True).data,
            "top_rated": MovieListSerializer(top_rated, many=True).data,
            "recent": MovieListSerializer(recent, many=True).data,
            "tamil": MovieListSerializer(tamil, many=True).data,
            "telugu": MovieListSerializer(telugu, many=True).data,
            "malayalam": MovieListSerializer(malayalam, many=True).data,
            "kannada": MovieListSerializer(kannada, many=True).data,
            "featured_legends": [
                {"name": "Kamal Haasan", "industry": "Tamil & Pan-Indian", "movies": ["Vikram", "Nayakan", "Indian"]},
                {"name": "Rajinikanth", "industry": "Tamil", "movies": ["Jailer", "Baashha", "Enthiran"]},
                {"name": "Mohanlal", "industry": "Malayalam", "movies": ["Drishyam", "Lucifer", "Drishyam 2"]},
                {"name": "Mammootty", "industry": "Malayalam", "movies": ["Bramayugam", "Kaathal - The Core", "Nanpakal Nerathu Mayakkam"]},
                {"name": "Prabhas", "industry": "Telugu", "movies": ["Baahubali 2: The Conclusion", "Baahubali: The Beginning", "Kalki 2898 AD", "Salaar"]},
                {"name": "Allu Arjun", "industry": "Telugu", "movies": ["Pushpa: The Rise", "Pushpa 2: The Rule", "Ala Vaikunthapurramuloo"]},
                {"name": "Ram Charan", "industry": "Telugu", "movies": ["RRR", "Rangasthalam", "Magadheera"]},
                {"name": "N.T. Rama Rao Jr.", "industry": "Telugu", "movies": ["RRR", "Devara: Part 1", "Janatha Garage"]},
                {"name": "Yash", "industry": "Kannada", "movies": ["K.G.F: Chapter 1", "K.G.F: Chapter 2", "Toxic"]},
                {"name": "Rishab Shetty", "industry": "Kannada", "movies": ["Kantara", "Kantara: Chapter 1", "Garuda Gamana Vrishabha Vahana"]},
                {"name": "Fahadh Faasil", "industry": "Malayalam", "movies": ["Aavesham", "Kumbalangi Nights", "Joji", "Pushpa: The Rise"]},
                {"name": "Vijay", "industry": "Tamil", "movies": ["Leo", "Master", "Mersal"]},
            ],
            "visionary_directors": [
                {"name": "S.S. Rajamouli", "industry": "Telugu", "movies": ["RRR", "Baahubali: The Beginning", "Baahubali 2: The Conclusion", "Eega"]},
                {"name": "Mani Ratnam", "industry": "Tamil", "movies": ["Ponniyin Selvan: Part I", "Ponniyin Selvan: Part II", "Nayakan", "Roja"]},
                {"name": "Lokesh Kanagaraj", "industry": "Tamil (LCU)", "movies": ["Vikram", "Leo", "Kaithi"]},
                {"name": "Prashanth Neel", "industry": "Kannada & Telugu", "movies": ["K.G.F: Chapter 1", "K.G.F: Chapter 2", "Salaar"]},
                {"name": "Sukumar", "industry": "Telugu", "movies": ["Pushpa: The Rise", "Pushpa 2: The Rule", "Rangasthalam"]},
                {"name": "Jeethu Joseph", "industry": "Malayalam", "movies": ["Drishyam", "Drishyam 2", "Memories"]},
            ]
        })


