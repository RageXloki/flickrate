"""Thin, defensive client for The Movie Database (TMDB) API.

Every method degrades gracefully: on timeout, network error, or missing
API key it returns `None` / `[]` rather than raising, so a temporary TMDB
outage never takes down the whole app (see spec section 41).
"""
import logging

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 6
MAX_RETRIES = 2


class TMDBClient:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.base_url = settings.TMDB_BASE_URL

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _get(self, path: str, params: dict | None = None, cache_seconds: int = 3600):
        if not self.is_configured:
            logger.warning("TMDB_API_KEY not set; skipping TMDB call to %s", path)
            return None

        params = params or {}
        params["api_key"] = self.api_key
        cache_key = f"tmdb:{path}:{sorted(params.items())}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        url = f"{self.base_url}{path}"
        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                resp = requests.get(url, params=params, timeout=TIMEOUT_SECONDS)
                resp.raise_for_status()
                data = resp.json()
                cache.set(cache_key, data, cache_seconds)
                return data
            except requests.RequestException as exc:
                last_error = exc
                logger.warning("TMDB request failed (attempt %s): %s", attempt + 1, exc)
        logger.error("TMDB request permanently failed for %s: %s", path, last_error)
        return None

    # --- discovery ---
    def trending(self, media_type="movie", window="week"):
        data = self._get(f"/trending/{media_type}/{window}", cache_seconds=1800)
        return (data or {}).get("results", [])

    def popular(self, page=1, region=None):
        params = {"page": page}
        if region:
            params["region"] = region
        data = self._get("/movie/popular", params, cache_seconds=1800)
        return (data or {}).get("results", [])

    def discover(self, **params):
        data = self._get("/discover/movie", params, cache_seconds=1800)
        return (data or {}).get("results", [])

    def search(self, query, page=1):
        data = self._get("/search/movie", {"query": query, "page": page}, cache_seconds=600)
        return data or {"results": [], "total_results": 0}

    def genres(self):
        data = self._get("/genre/movie/list", cache_seconds=86400)
        return (data or {}).get("genres", [])

    # --- detail ---
    def movie_details(self, tmdb_id):
        return self._get(
            f"/movie/{tmdb_id}",
            {"append_to_response": "credits,videos,keywords,external_ids"},
            cache_seconds=86400,
        )

    def image_url(self, path, size="w500"):
        if not path:
            return ""
        return f"{settings.TMDB_IMAGE_BASE_URL}/{size}{path}"

    @staticmethod
    def official_trailer_key(videos_response: dict | None):
        if not videos_response:
            return ""
        for v in videos_response.get("results", []):
            if v.get("site") == "YouTube" and v.get("type") == "Trailer" and v.get("official"):
                return v.get("key", "")
        for v in videos_response.get("results", []):
            if v.get("site") == "YouTube" and v.get("type") == "Trailer":
                return v.get("key", "")
        return ""


tmdb_client = TMDBClient()
