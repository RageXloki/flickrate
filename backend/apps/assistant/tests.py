from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.movies.models import Movie, Genre


class AssistantTests(APITestCase):
    """These tests exercise the deterministic fallback path (no
    ANTHROPIC_API_KEY configured in the test environment), which is the
    code path guaranteed to run without any external dependency."""

    def setUp(self):
        self.thriller = Genre.objects.create(name="Thriller")
        self.comedy = Genre.objects.create(name="Comedy")

        self.dark_thriller = Movie.objects.create(
            title="Shutter Island", release_date=date(2010, 2, 19),
            overview="A U.S. Marshal investigates a psychiatric facility on a remote island.",
            keywords=["psychological", "dark", "mystery"], imdb_rating=8.2, popularity=200,
        )
        self.dark_thriller.genres.add(self.thriller)

        self.light_comedy = Movie.objects.create(
            title="Silly Comedy", release_date=date(2015, 1, 1),
            overview="A group of friends get into wacky situations.",
            keywords=["funny"], imdb_rating=6.0, popularity=50,
        )
        self.light_comedy.genres.add(self.comedy)

    def test_assistant_matches_genre_and_mood(self):
        resp = self.client.post(reverse("assistant"), {"query": "I want a dark psychological thriller"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = {m["title"] for m in resp.data["results"]}
        self.assertIn("Shutter Island", titles)
        self.assertNotIn("Silly Comedy", titles)

    def test_assistant_matches_decade(self):
        resp = self.client.post(reverse("assistant"), {"query": "something from the 2010s"})
        self.assertEqual(resp.data["filters"]["year_min"], 2010)
        self.assertEqual(resp.data["filters"]["year_max"], 2019)

    def test_assistant_empty_query(self):
        resp = self.client.post(reverse("assistant"), {"query": ""})
        self.assertEqual(resp.data["mode"], "none")
        self.assertEqual(resp.data["results"], [])

    def test_assistant_uses_deterministic_mode_without_key(self):
        resp = self.client.post(reverse("assistant"), {"query": "highly rated thriller"})
        self.assertEqual(resp.data["mode"], "deterministic")

    def test_assistant_matches_runtime_limit(self):
        resp = self.client.post(reverse("assistant"), {"query": "thriller less than 2 hours long"})
        self.assertEqual(resp.data["filters"]["max_runtime"], 120)

    def test_assistant_matches_industry_and_after_year(self):
        resp = self.client.post(reverse("assistant"), {"query": "Show me Hindi comedy movies released after 2018"})
        self.assertEqual(resp.data["filters"]["industry"], "bollywood")
        self.assertEqual(resp.data["filters"]["year_min"], 2019)

