from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from apps.movies.models import Movie


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    title = models.CharField(max_length=120, blank=True, default="")
    body = models.TextField(blank=True, default="")
    is_spoiler = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "movie"], name="one_review_per_user_per_movie"),
        ]

    def __str__(self):
        return f"{self.user} — {self.movie} ({self.rating}/10)"


class ReviewHelpfulVote(models.Model):
    """Tracks which users marked a review helpful, so 'most helpful'
    sorting is real and votes can't be duplicated."""

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="helpful_votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["review", "user"], name="one_helpful_vote_per_user"),
        ]


class ReviewReport(models.Model):
    """Stores user moderation reports for inappropriate or spoiler-heavy reviews."""

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="reports")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_reports")
    reason = models.CharField(max_length=64)
    details = models.TextField(blank=True, default="")
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["review", "user"], name="one_report_per_user_per_review"),
        ]

    def __str__(self):
        return f"Report on Review {self.review_id} by {self.user} ({self.reason})"

