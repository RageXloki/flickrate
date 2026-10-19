from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.movies.models import Movie
from .engine import recommend_similar_to, recommend_for_user
from .serializers import RecommendationSerializer


class SimilarMoviesView(APIView):
    """GET /api/recommendations/?movie_id=123

    Content-based 'Because you liked X' recommendations. Public — no login
    required, since this is useful straight from a movie detail page.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        movie_id = request.query_params.get("movie_id")
        if not movie_id:
            return Response({"detail": "movie_id query param is required."}, status=400)
        try:
            movie = Movie.objects.prefetch_related("genres").get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        scored = recommend_similar_to(movie)
        return Response({
            "seed_movie": movie.title,
            "results": RecommendationSerializer.from_scored(scored),
        })


class PersonalizedRecommendationsView(APIView):
    """GET /api/recommendations/personalized/

    Requires auth. Uses the user's ratings/watchlist/interactions; falls
    back to 'Popular picks for you' with a nudge for brand-new users.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        scored = recommend_for_user(request.user)
        is_cold_start = all(r.reasons == ["Popular pick for you"] for r in scored) if scored else True
        return Response({
            "personalized": not is_cold_start,
            "message": None if not is_cold_start else "Rate a few movies to improve your recommendations.",
            "results": RecommendationSerializer.from_scored(scored),
        })


class MoodRecommendationsView(APIView):
    """GET /api/recommendations/mood/?mood=happy

    Returns movies matched and ranked according to the selected mood:
    Happy, Sad, Romantic, Exciting, Scary, Relaxing, Inspirational,
    Mind-bending, Emotional, Funny.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .engine import recommend_by_mood, MOOD_PROFILES
        mood_param = request.query_params.get("mood", "happy").lower().strip()
        profile = MOOD_PROFILES.get(mood_param, MOOD_PROFILES["happy"])
        scored = recommend_by_mood(mood_param)

        available_moods = [
            {"key": k, "label": v["label"], "tone": v["tone"]}
            for k, v in MOOD_PROFILES.items()
        ]

        return Response({
            "mood": mood_param,
            "mood_label": profile["label"],
            "tone": profile["tone"],
            "results": RecommendationSerializer.from_scored(scored),
            "available_moods": available_moods,
        })

