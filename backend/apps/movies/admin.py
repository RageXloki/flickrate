from django.contrib import admin
from .models import Movie, Genre, MovieInteraction


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "tmdb_id")
    search_fields = ("name",)


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "year", "industry", "imdb_rating", "rotten_tomatoes_rating", "flickrate_score", "popularity")
    list_filter = ("industry", "original_language")
    search_fields = ("title", "original_title", "director")
    filter_horizontal = ("genres",)


@admin.register(MovieInteraction)
class MovieInteractionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "movie", "kind", "created_at")
    list_filter = ("kind",)
