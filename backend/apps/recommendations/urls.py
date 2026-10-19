from django.urls import path

from .views import SimilarMoviesView, PersonalizedRecommendationsView, MoodRecommendationsView

urlpatterns = [
    path("", SimilarMoviesView.as_view(), name="recommendations-similar"),
    path("personalized/", PersonalizedRecommendationsView.as_view(), name="recommendations-personalized"),
    path("mood/", MoodRecommendationsView.as_view(), name="recommendations-mood"),
]

