from django.urls import path

from .views import (
    MovieListView, MovieDetailView, MovieSearchView, TrendingView,
    PopularView, GenreListView, MovieTrailerView, TrackInteractionView,
    TopRatedView, NewReleasesView, BollywoodView, HollywoodView, RateMovieView,
    PersonDetailView, RegionalCinemaView,
    AdminStatsView, AdminUsersView, AdminReviewsView, AdminSyncMovieView,
)

urlpatterns = [
    path("", MovieListView.as_view(), name="movie-list"),
    path("search/", MovieSearchView.as_view(), name="movie-search"),
    path("trending/", TrendingView.as_view(), name="movie-trending"),
    path("popular/", PopularView.as_view(), name="movie-popular"),
    path("top-rated/", TopRatedView.as_view(), name="movie-top-rated"),
    path("new-releases/", NewReleasesView.as_view(), name="movie-new-releases"),
    path("bollywood/", BollywoodView.as_view(), name="movie-bollywood"),
    path("hollywood/", HollywoodView.as_view(), name="movie-hollywood"),
    path("regional/", RegionalCinemaView.as_view(), name="movie-regional"),
    path("person/<str:name>/", PersonDetailView.as_view(), name="movie-person"),
    path("genres/", GenreListView.as_view(), name="movie-genres"),
    path("<int:pk>/", MovieDetailView.as_view(), name="movie-detail"),
    path("<int:pk>/trailer/", MovieTrailerView.as_view(), name="movie-trailer"),
    path("<int:pk>/interact/", TrackInteractionView.as_view(), name="movie-interact"),
    path("<int:pk>/rate/", RateMovieView.as_view(), name="movie-rate"),

    # Admin portal endpoints
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", AdminUsersView.as_view(), name="admin-users"),
    path("admin/reviews/", AdminReviewsView.as_view(), name="admin-reviews-list"),
    path("admin/reviews/<int:pk>/", AdminReviewsView.as_view(), name="admin-review-detail"),
    path("admin/sync/", AdminSyncMovieView.as_view(), name="admin-sync-movie"),
]

