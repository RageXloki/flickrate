from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.movies.models import Movie
from apps.movies.services.ingest import recompute_flickrate_score
from .models import Review, ReviewHelpfulVote
from .serializers import ReviewSerializer

SORT_MAP = {
    "newest": "-created_at",
    "oldest": "created_at",
    "highest_rated": "-rating",
    "lowest_rated": "rating",
    "most_helpful": "-helpful_count",
}


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class MovieReviewListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/movies/:movie_id/reviews/"""

    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Review.objects.filter(movie_id=self.kwargs["movie_id"]).select_related("user")
        sort = self.request.query_params.get("sort", "newest")
        return qs.order_by(SORT_MAP.get(sort, "-created_at"))

    def perform_create(self, serializer):
        movie = Movie.objects.get(pk=self.kwargs["movie_id"])
        review = serializer.save(user=self.request.user, movie=movie)
        recompute_flickrate_score(movie)
        return review


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/reviews/:id/"""

    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Review.objects.select_related("user", "movie")

    def perform_update(self, serializer):
        review = serializer.save()
        recompute_flickrate_score(review.movie)

    def perform_destroy(self, instance):
        movie = instance.movie
        instance.delete()
        recompute_flickrate_score(movie)


class MarkReviewHelpfulView(APIView):
    """POST /api/reviews/:id/helpful/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({"detail": "Review not found."}, status=404)

        _vote, created = ReviewHelpfulVote.objects.get_or_create(review=review, user=request.user)
        if created:
            review.helpful_count = review.helpful_votes.count()
            review.save(update_fields=["helpful_count"])
        return Response({"helpful_count": review.helpful_count}, status=status.HTTP_200_OK)
 
 
class ReportReviewView(APIView):
    """POST /api/reviews/:id/report/
    body: { reason: "spoiler"|"spam"|"inappropriate"|"harassment", details?: string }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({"detail": "Review not found."}, status=404)

        reason = request.data.get("reason", "inappropriate").strip() or "inappropriate"
        details = request.data.get("details", "").strip()

        from .models import ReviewReport
        report, created = ReviewReport.objects.get_or_create(
            review=review,
            user=request.user,
            defaults={"reason": reason, "details": details}
        )
        if not created and details:
            report.details = details
            report.reason = reason
            report.save(update_fields=["reason", "details"])

        return Response(
            {"detail": "Review reported successfully. Moderation will review."},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

