from rest_framework import serializers

from apps.movies.serializers import MovieListSerializer


class RecommendationSerializer(serializers.Serializer):
    movie = MovieListSerializer()
    score = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.CharField())

    @staticmethod
    def from_scored(scored_list):
        return [
            {"movie": MovieListSerializer(s.movie).data, "score": s.score, "reasons": s.reasons}
            for s in scored_list
        ]
