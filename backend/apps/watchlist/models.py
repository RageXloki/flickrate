from django.conf import settings
from django.db import models

from apps.movies.models import Movie


class WatchlistEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="watchlist_entries")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="watchlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "movie"], name="one_watchlist_entry_per_user_movie"),
        ]

    def __str__(self):
        return f"{self.user} → {self.movie}"


class WatchedMovie(models.Model):
    """Tracks movies the user has actually watched, distinct from intent-to-watch watchlist."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="watched_movies")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="watched_by")
    watched_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-watched_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "movie"], name="one_watched_entry_per_user_movie"),
        ]

    def __str__(self):
        return f"{self.user} watched {self.movie}"


class CustomList(models.Model):
    """User-curated thematic movie lists (e.g. 'Ultimate Sci-Fi Mindbenders', 'Rainy Day Comforts')."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="custom_lists")
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} by {self.user}"


class CustomListItem(models.Model):
    custom_list = models.ForeignKey(CustomList, on_delete=models.CASCADE, related_name="items")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="in_custom_lists")
    notes = models.CharField(max_length=255, blank=True, default="")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["added_at"]
        constraints = [
            models.UniqueConstraint(fields=["custom_list", "movie"], name="one_movie_per_custom_list"),
        ]

    def __str__(self):
        return f"{self.movie} in {self.custom_list.title}"

