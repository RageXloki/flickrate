"""Thin, defensive client for the OMDb API.

Used specifically for IMDb rating/votes and Rotten Tomatoes score, since
TMDB does not provide either. If OMDb doesn't return a Rotten Tomatoes
rating for a title, we surface `None` and the frontend renders
'Not available' rather than inventing a number (see spec section 9).
"""
import logging

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 6


class OMDbClient:
    def __init__(self):
        self.api_key = settings.OMDB_API_KEY
        self.base_url = settings.OMDB_BASE_URL

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def by_imdb_id(self, imdb_id: str) -> dict | None:
        if not self.is_configured or not imdb_id:
            return None

        cache_key = f"omdb:{imdb_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            resp = requests.get(
                self.base_url,
                params={"apikey": self.api_key, "i": imdb_id, "plot": "short"},
                timeout=TIMEOUT_SECONDS,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("Response") == "False":
                logger.info("OMDb had no data for %s: %s", imdb_id, data.get("Error"))
                return None
            cache.set(cache_key, data, 86400)
            return data
        except requests.RequestException as exc:
            logger.warning("OMDb request failed for %s: %s", imdb_id, exc)
            return None

    @staticmethod
    def extract_ratings(omdb_payload: dict | None) -> dict:
        """Returns {imdb_rating, imdb_votes, rotten_tomatoes, metascore, awards, box_office, rated}
        with None for anything OMDb didn't legitimately provide."""
        result = {
            "imdb_rating": None,
            "imdb_votes": None,
            "rotten_tomatoes": None,
            "metascore": None,
            "awards": "",
            "box_office": None,
            "rated": "",
        }
        if not omdb_payload:
            return result

        try:
            if omdb_payload.get("imdbRating") not in (None, "N/A"):
                result["imdb_rating"] = float(omdb_payload["imdbRating"])
        except (ValueError, TypeError):
            pass

        try:
            votes = omdb_payload.get("imdbVotes")
            if votes and votes != "N/A":
                result["imdb_votes"] = int(votes.replace(",", ""))
        except (ValueError, TypeError):
            pass

        try:
            meta = omdb_payload.get("Metascore")
            if meta and meta != "N/A":
                result["metascore"] = int(meta)
        except (ValueError, TypeError):
            pass

        if omdb_payload.get("Awards") and omdb_payload["Awards"] != "N/A":
            result["awards"] = omdb_payload["Awards"]

        if omdb_payload.get("Rated") and omdb_payload["Rated"] != "N/A":
            result["rated"] = omdb_payload["Rated"]

        try:
            bo = omdb_payload.get("BoxOffice")
            if bo and bo != "N/A":
                # Remove $, commas
                clean_bo = bo.replace("$", "").replace(",", "")
                result["box_office"] = int(clean_bo)
        except (ValueError, TypeError):
            pass

        for rating in omdb_payload.get("Ratings", []):
            if rating.get("Source") == "Rotten Tomatoes":
                try:
                    result["rotten_tomatoes"] = int(rating["Value"].replace("%", ""))
                except (ValueError, TypeError):
                    pass
            elif rating.get("Source") == "Metacritic" and result["metascore"] is None:
                try:
                    result["metascore"] = int(rating["Value"].split("/")[0])
                except (ValueError, TypeError):
                    pass

        return result


omdb_client = OMDbClient()
