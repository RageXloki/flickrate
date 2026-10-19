from django.urls import path

from .views import (
    WatchlistListView, WatchlistToggleView,
    WatchedMovieListView, WatchedMovieToggleView
)

urlpatterns = [
    path("", WatchlistListView.as_view(), name="watchlist-list"),
    path("<int:movie_id>/", WatchlistToggleView.as_view(), name="watchlist-toggle"),
    path("watched/", WatchedMovieListView.as_view(), name="watched-list"),
    path("watched/<int:movie_id>/", WatchedMovieToggleView.as_view(), name="watched-toggle"),
]
