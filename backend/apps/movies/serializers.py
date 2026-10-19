from django.conf import settings
from rest_framework import serializers

from .models import Movie, Genre


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ("id", "name")


def _image_url(path, size):
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{settings.TMDB_IMAGE_BASE_URL}/{size}{path}"


class MovieListSerializer(serializers.ModelSerializer):
    """Compact shape used for cards, trending rails, search results."""

    year = serializers.IntegerField(read_only=True)
    poster_url = serializers.SerializerMethodField()
    backdrop_url = serializers.SerializerMethodField()
    genres = GenreSerializer(many=True, read_only=True)
    rotten_tomatoes_rating = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = (
            "id", "title", "year", "poster_url", "backdrop_url", "genres",
            "imdb_rating", "rotten_tomatoes_rating", "flickrate_score",
            "industry", "popularity",
        )

    def get_poster_url(self, obj):
        return _image_url(obj.poster_path, "w342")

    def get_backdrop_url(self, obj):
        return _image_url(obj.backdrop_path, "w1280")

    def get_rotten_tomatoes_rating(self, obj):
        return obj.rotten_tomatoes_rating  # None -> frontend renders "Not available"


class MovieDetailSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(read_only=True)
    poster_url = serializers.SerializerMethodField()
    backdrop_url = serializers.SerializerMethodField()
    trailer_url = serializers.SerializerMethodField()
    genres = GenreSerializer(many=True, read_only=True)
    review_count = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()
    user_rating_avg = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = (
            "id", "tmdb_id", "imdb_id", "title", "original_title", "tagline",
            "overview", "release_date", "year", "runtime_minutes", "genres",
            "original_language", "spoken_languages", "country", "industry",
            "poster_url", "backdrop_url", "trailer_url", "director", "writers", "cast",
            "cast_details", "crew_details", "production_companies",
            "certification", "budget", "revenue", "awards", "videos", "external_links", "critic_reviews",
            "keywords", "imdb_rating", "imdb_votes", "rotten_tomatoes_rating", "metascore",
            "flickrate_score", "popularity", "review_count", "rating_distribution",
            "user_rating_avg", "user_rating",
        )

    def get_poster_url(self, obj):
        return _image_url(obj.poster_path, "w500")

    def get_backdrop_url(self, obj):
        return _image_url(obj.backdrop_path, "original")

    def get_trailer_url(self, obj):
        if not obj.trailer_youtube_key:
            return None
        return f"https://www.youtube.com/watch?v={obj.trailer_youtube_key}"

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_rating_distribution(self, obj):
        from django.db.models import Count
        distribution = {str(i): 0 for i in range(1, 11)}
        counts = obj.reviews.values("rating").annotate(total=Count("id"))
        for item in counts:
            distribution[str(item["rating"])] = item["total"]
        return distribution

    def get_user_rating_avg(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(avg=Avg("rating"))["avg"]
        return round(float(avg), 1) if avg is not None else None

    def get_user_rating(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            user_rev = obj.reviews.filter(user=request.user).first()
            if user_rev:
                return user_rev.rating
        return None

