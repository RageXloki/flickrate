from django.contrib import admin
from .models import WatchlistEntry


@admin.register(WatchlistEntry)
class WatchlistEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "movie", "created_at")
