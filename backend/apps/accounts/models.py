from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user so we can attach FlickRate-specific profile fields."""

    avatar_url = models.URLField(blank=True, default="")
    bio = models.CharField(max_length=280, blank=True, default="")
    favorite_genres = models.JSONField(default=list, blank=True)  # list[str]
    preferred_languages = models.JSONField(default=list, blank=True)  # list[str]
    preferred_industries = models.JSONField(default=list, blank=True)  # list[str]

    def __str__(self):
        return self.username

