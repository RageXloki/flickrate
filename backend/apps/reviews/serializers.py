from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.CharField(source="user.avatar_url", read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id", "movie", "username", "avatar_url", "rating", "title",
            "body", "is_spoiler", "helpful_count", "created_at", "updated_at", "is_mine",
        )
        read_only_fields = ("id", "movie", "helpful_count", "created_at", "updated_at")

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)

    def validate(self, attrs):
        request = self.context.get("request")
        view = self.context.get("view")
        movie_id = view.kwargs.get("movie_id") if view else None
        if request and self.instance is None and movie_id:
            if Review.objects.filter(user=request.user, movie_id=movie_id).exists():
                raise serializers.ValidationError("You've already reviewed this movie. Edit your existing review instead.")
        return attrs


class ReviewReportSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        from .models import ReviewReport
        model = ReviewReport
        fields = ("id", "review", "username", "reason", "details", "resolved", "created_at")
        read_only_fields = ("id", "review", "username", "resolved", "created_at")


