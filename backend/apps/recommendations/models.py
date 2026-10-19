# This app is intentionally model-less: recommendations are computed on the
# fly from Movie, Review, WatchlistEntry, and MovieInteraction data owned by
# their respective apps. Keeping it stateless keeps the scoring formula easy
# to tune without a migration.
