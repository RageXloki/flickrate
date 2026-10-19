from django.urls import path

from .views import (
    CustomListListCreateView,
    CustomListDetailView,
    CustomListMovieToggleView,
)

urlpatterns = [
    path("", CustomListListCreateView.as_view(), name="custom-list-list-create"),
    path("<int:pk>/", CustomListDetailView.as_view(), name="custom-list-detail"),
    path("<int:pk>/movies/<int:movie_id>/", CustomListMovieToggleView.as_view(), name="custom-list-movie-toggle"),
]
