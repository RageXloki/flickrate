from rest_framework import serializers

from apps.movies.serializers import MovieListSerializer
from .models import WatchlistEntry, WatchedMovie, CustomList, CustomListItem


class WatchlistEntrySerializer(serializers.ModelSerializer):
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = WatchlistEntry
        fields = ("id", "movie", "created_at")


class WatchedMovieSerializer(serializers.ModelSerializer):
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = WatchedMovie
        fields = ("id", "movie", "watched_date", "created_at")


class CustomListItemSerializer(serializers.ModelSerializer):
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = CustomListItem
        fields = ("id", "movie", "notes", "added_at")


class CustomListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    items = CustomListItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = CustomList
        fields = (
            "id", "user", "username", "title", "description",
            "is_private", "created_at", "updated_at", "items", "item_count", "is_owner"
        )
        read_only_fields = ("id", "user", "username", "created_at", "updated_at")

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)

