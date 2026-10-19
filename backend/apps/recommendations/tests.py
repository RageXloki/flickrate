from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.movies.models import Movie, Genre
from apps.recommendations.engine import recommend_similar_to, recommend_for_user

User = get_user_model()


class RecommendationEngineTests(APITestCase):
    def setUp(self):
        self.action = Genre.objects.create(name="Action")
        self.scifi = Genre.objects.create(name="Sci-Fi")
        self.romance = Genre.objects.create(name="Romance")

        self.nolan_film_1 = Movie.objects.create(
            title="Inception", release_date=date(2010, 1, 1), director="Christopher Nolan",
            cast=["Leonardo DiCaprio"], overview="A thief who steals corporate secrets through dream-sharing.",
            keywords=["dream", "heist"], popularity=400, flickrate_score=Decimal("8.8"),
        )
        self.nolan_film_1.genres.add(self.action, self.scifi)

        self.nolan_film_2 = Movie.objects.create(
            title="Interstellar", release_date=date(2014, 1, 1), director="Christopher Nolan",
            cast=["Matthew McConaughey"], overview="A team travels through a wormhole in space to save humanity.",
            keywords=["space", "wormhole"], popularity=350, flickrate_score=Decimal("8.6"),
        )
        self.nolan_film_2.genres.add(self.scifi)

        self.unrelated_film = Movie.objects.create(
            title="Love Actually", release_date=date(2003, 1, 1), director="Richard Curtis",
            cast=["Hugh Grant"], overview="Follows the lives of eight couples in London during the holidays.",
            keywords=["holiday", "romance"], popularity=100, flickrate_score=Decimal("7.0"),
        )
        self.unrelated_film.genres.add(self.romance)

    def test_similar_movies_ranks_related_film_higher(self):
        results = recommend_similar_to(self.nolan_film_1)
        result_titles = [r.movie.title for r in results]
        self.assertIn("Interstellar", result_titles)
        self.assertLess(
            result_titles.index("Interstellar"),
            result_titles.index("Love Actually"),
        )

    def test_similar_movies_gives_reasons(self):
        results = recommend_similar_to(self.nolan_film_1)
        interstellar = next(r for r in results if r.movie.title == "Interstellar")
        self.assertIn("Same director", interstellar.reasons)

    def test_similar_movies_excludes_seed(self):
        results = recommend_similar_to(self.nolan_film_1)
        self.assertNotIn(self.nolan_film_1.id, [r.movie.id for r in results])

    def test_personalized_recommendations_cold_start(self):
        user = User.objects.create_user(username="newbie", email="n@example.com", password="StrongPass123!")
        results = recommend_for_user(user)
        self.assertTrue(all(r.reasons == ["Popular pick for you"] for r in results))

    def test_personalized_endpoint_requires_auth(self):
        resp = self.client.get(reverse("recommendations-personalized"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_similar_endpoint_requires_movie_id(self):
        resp = self.client.get(reverse("recommendations-similar"))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_similar_endpoint_404_unknown_movie(self):
        resp = self.client.get(reverse("recommendations-similar"), {"movie_id": 999999})
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_similar_endpoint_returns_reasons(self):
        resp = self.client.get(reverse("recommendations-similar"), {"movie_id": self.nolan_film_1.id})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(all("reasons" in r for r in resp.data["results"]))

    def test_mood_recommendations_endpoint(self):
        resp = self.client.get(reverse("recommendations-mood"), {"mood": "mind-bending"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("mood", resp.data)
        self.assertIn("available_moods", resp.data)
        self.assertGreater(len(resp.data["available_moods"]), 5)

