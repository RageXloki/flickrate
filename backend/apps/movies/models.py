from django.conf import settings
from django.db import models


class Genre(models.Model):
    tmdb_id = models.IntegerField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Movie(models.Model):
    class Industry(models.TextChoices):
        HOLLYWOOD = "hollywood", "Hollywood"
        BOLLYWOOD = "bollywood", "Bollywood"
        INDIAN_REGIONAL = "indian_regional", "Indian Regional Cinema"
        OTHER = "other", "Other"

    # --- external identifiers ---
    tmdb_id = models.IntegerField(unique=True, null=True, blank=True, db_index=True)
    imdb_id = models.CharField(max_length=16, blank=True, default="", db_index=True)

    # --- core metadata ---
    title = models.CharField(max_length=255, db_index=True)
    original_title = models.CharField(max_length=255, blank=True, default="")
    tagline = models.CharField(max_length=255, blank=True, default="")
    overview = models.TextField(blank=True, default="")
    release_date = models.DateField(null=True, blank=True)
    runtime_minutes = models.PositiveIntegerField(null=True, blank=True)

    genres = models.ManyToManyField(Genre, related_name="movies", blank=True)
    original_language = models.CharField(max_length=8, blank=True, default="")
    spoken_languages = models.JSONField(default=list, blank=True)  # list[str]
    country = models.CharField(max_length=8, blank=True, default="")
    industry = models.CharField(max_length=20, choices=Industry.choices, default=Industry.OTHER, db_index=True)

    # --- media ---
    poster_path = models.CharField(max_length=255, blank=True, default="")
    backdrop_path = models.CharField(max_length=255, blank=True, default="")
    trailer_youtube_key = models.CharField(max_length=32, blank=True, default="")

    # --- people & production ---
    director = models.CharField(max_length=255, blank=True, default="")
    writers = models.JSONField(default=list, blank=True)  # list[str] screenplay / story writers
    cast = models.JSONField(default=list, blank=True)  # list[str] top-billed actors
    cast_details = models.JSONField(default=list, blank=True)  # list[{name, character, profile_path, id}]
    crew_details = models.JSONField(default=list, blank=True)  # list[{name, job, department}]
    production_companies = models.JSONField(default=list, blank=True)  # list[str]
    keywords = models.JSONField(default=list, blank=True)  # list[str]

    # --- financial & certification ---
    certification = models.CharField(max_length=32, blank=True, default="")
    budget = models.BigIntegerField(null=True, blank=True)
    revenue = models.BigIntegerField(null=True, blank=True)
    awards = models.CharField(max_length=255, blank=True, default="")

    # --- additional media & external links ---
    videos = models.JSONField(default=list, blank=True)  # list[{key, name, site, type, official}]
    external_links = models.JSONField(default=dict, blank=True)  # {imdb, tmdb, homepage, etc}
    critic_reviews = models.JSONField(default=list, blank=True)  # list[{author, publication, content, url, date}]

    # --- ratings ---
    imdb_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    imdb_votes = models.PositiveIntegerField(null=True, blank=True)
    rotten_tomatoes_rating = models.PositiveSmallIntegerField(null=True, blank=True)  # percent, or null
    metascore = models.PositiveSmallIntegerField(null=True, blank=True)  # Metacritic 0-100
    flickrate_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, db_index=True)
    popularity = models.FloatField(default=0.0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-popularity"]
        indexes = [
            models.Index(fields=["release_date"]),
            models.Index(fields=["industry"]),
            models.Index(fields=["-flickrate_score"]),
            models.Index(fields=["-popularity"]),
        ]

    def __str__(self):
        year = self.release_date.year if self.release_date else "????"
        return f"{self.title} ({year})"

    @property
    def year(self):
        return self.release_date.year if self.release_date else None


class MovieInteraction(models.Model):
    """Lightweight interaction log used both for analytics and as a signal
    for personalized recommendations."""

    class Kind(models.TextChoices):
        VIEW = "view", "View"
        LIKE = "like", "Like"
        CLICK = "click", "Click"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interactions")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="interactions")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "kind"])]


class SearchHistory(models.Model):
    """Tracks search queries for analytics, search trends, and personalization."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="searches")
    query = models.CharField(max_length=255, db_index=True)
    results_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Search histories"

