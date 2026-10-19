from django.urls import path

from .views import MovieReviewListCreateView, ReviewDetailView, MarkReviewHelpfulView, ReportReviewView

urlpatterns = [
    # Note: /api/movies/:movie_id/reviews/ is also mounted from config.urls
    # via a second include below for spec-compliant nesting.
    path("<int:pk>/", ReviewDetailView.as_view(), name="review-detail"),
    path("<int:pk>/helpful/", MarkReviewHelpfulView.as_view(), name="review-helpful"),
    path("<int:pk>/report/", ReportReviewView.as_view(), name="review-report"),
]

movie_nested_urlpatterns = [
    path("<int:movie_id>/reviews/", MovieReviewListCreateView.as_view(), name="movie-reviews"),
]
