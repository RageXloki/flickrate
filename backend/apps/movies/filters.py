import django_filters as filters

from .models import Movie


class MovieFilter(filters.FilterSet):
    genre = filters.CharFilter(field_name="genres__name", lookup_expr="iexact")
    year = filters.NumberFilter(field_name="release_date", lookup_expr="year")
    year_min = filters.NumberFilter(field_name="release_date", lookup_expr="year__gte")
    year_max = filters.NumberFilter(field_name="release_date", lookup_expr="year__lte")
    language = filters.CharFilter(field_name="original_language", lookup_expr="iexact")
    country = filters.CharFilter(field_name="country", lookup_expr="iexact")
    industry = filters.CharFilter(field_name="industry", lookup_expr="iexact")
    min_rating = filters.NumberFilter(field_name="imdb_rating", lookup_expr="gte")

    class Meta:
        model = Movie
        fields = ["genre", "year", "language", "country", "industry"]
