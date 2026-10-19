"""FlickRate's own transparent 0-10 score for a movie.

FlickRate Score = weighted combination of:
  - IMDb rating            (normalized to 0-10)              weight 0.35
  - Rotten Tomatoes rating (normalized 0-100 -> 0-10)         weight 0.25
  - FlickRate user ratings (average of Review.rating, 1-10)   weight 0.25
  - Popularity              (log-scaled, capped)              weight 0.15

Any missing component is dropped and the remaining weights are
renormalized, so a movie missing an RT score (common outside the US) is
never penalized for data availability rather than quality.
"""
import math
from decimal import Decimal, ROUND_HALF_UP

WEIGHTS = {
    "imdb": 0.35,
    "rotten_tomatoes": 0.25,
    "user_ratings": 0.25,
    "popularity": 0.15,
}

# Popularity values from TMDB are roughly log-normal and unbounded; we
# squash them into a 0-10 range with a log curve so a handful of
# viral titles don't dominate the score.
POPULARITY_LOG_BASE = 10


def _popularity_component(popularity: float) -> float:
    if not popularity or popularity <= 0:
        return 0.0
    return min(10.0, math.log(popularity + 1, POPULARITY_LOG_BASE) * 5.0)


def compute_flickrate_score(
    imdb_rating: float | None,
    rotten_tomatoes: int | None,
    user_rating_avg: float | None,
    popularity: float | None,
) -> Decimal | None:
    components = {}

    if imdb_rating is not None:
        components["imdb"] = float(imdb_rating)  # already 0-10
    if rotten_tomatoes is not None:
        components["rotten_tomatoes"] = rotten_tomatoes / 10.0  # 0-100 -> 0-10
    if user_rating_avg is not None:
        components["user_ratings"] = float(user_rating_avg)  # already 0-10
    if popularity is not None:
        components["popularity"] = _popularity_component(popularity)

    if not components:
        return None

    total_weight = sum(WEIGHTS[k] for k in components)
    if total_weight == 0:
        return None

    weighted_sum = sum(WEIGHTS[k] * v for k, v in components.items())
    score = weighted_sum / total_weight
    score = max(0.0, min(10.0, score))

    return Decimal(str(score)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


FORMULA_EXPLANATION = (
    "FlickRate Score blends IMDb rating (35%), Rotten Tomatoes score (25%), "
    "FlickRate user ratings (25%), and popularity (15%). Any signal that "
    "isn't available for a title is excluded and the remaining weights are "
    "rebalanced, so the score is never penalized for missing third-party data."
)
