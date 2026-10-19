from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.movies.models import Movie, Genre
from apps.movies.services.scoring import compute_flickrate_score


def make_movie(**kwargs):
    defaults = dict(
        title="Test Movie", release_date=date(2020, 1, 1), overview="A test overview.",
        director="Test Director", cast=["Actor A", "Actor B"], popularity=10.0,
        imdb_rating=Decimal("7.5"), rotten_tomatoes_rating=80,
    )
    defaults.update(kwargs)
    return Movie.objects.create(**defaults)


class MovieEndpointTests(APITestCase):
    def setUp(self):
        self.action_genre = Genre.objects.create(name="Action")
        self.drama_genre = Genre.objects.create(name="Drama")

        self.m1 = make_movie(title="The Dark Knight", release_date=date(2008, 7, 18), popularity=500)
        self.m1.genres.add(self.action_genre)

        self.m2 = make_movie(title="Inception", release_date=date(2010, 7, 16), popularity=400)
        self.m2.genres.add(self.action_genre, self.drama_genre)

        self.m3 = make_movie(title="Quiet Drama", release_date=date(1999, 3, 1), popularity=5)
        self.m3.genres.add(self.drama_genre)

    def test_movie_list_returns_all(self):
        resp = self.client.get(reverse("movie-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 3)

    def test_movie_list_filters_by_genre(self):
        resp = self.client.get(reverse("movie-list"), {"genre": "Action"})
        titles = {m["title"] for m in resp.data["results"]}
        self.assertEqual(titles, {"The Dark Knight", "Inception"})

    def test_movie_list_sorts_by_popularity_by_default(self):
        resp = self.client.get(reverse("movie-list"))
        titles = [m["title"] for m in resp.data["results"]]
        self.assertEqual(titles, ["The Dark Knight", "Inception", "Quiet Drama"])

    def test_movie_detail_returns_full_shape(self):
        resp = self.client.get(reverse("movie-detail", args=[self.m1.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "The Dark Knight")
        self.assertIn("director", resp.data)
        self.assertIn("flickrate_score", resp.data)

    def test_movie_detail_404_for_unknown_id_without_tmdb_configured(self):
        resp = self.client.get(reverse("movie-detail", args=[999999]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_matches_title(self):
        resp = self.client.get(reverse("movie-search"), {"q": "Dark Knight"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titles = {m["title"] for m in resp.data["local_results"]}
        self.assertIn("The Dark Knight", titles)

    def test_search_matches_director(self):
        make_movie(title="Director Match", director="Christopher Nolan", popularity=1)
        resp = self.client.get(reverse("movie-search"), {"q": "Christopher Nolan"})
        titles = {m["title"] for m in resp.data["local_results"]}
        self.assertIn("Director Match", titles)

    def test_search_empty_query_returns_empty(self):
        resp = self.client.get(reverse("movie-search"), {"q": ""})
        self.assertEqual(resp.data["local_results"], [])

    def test_trending_endpoint(self):
        resp = self.client.get(reverse("movie-trending"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_genres_endpoint(self):
        resp = self.client.get(reverse("movie-genres"))
        names = {g["name"] for g in resp.data["results"]} if "results" in resp.data else {g["name"] for g in resp.data}
        self.assertIn("Action", names)

    def test_trailer_unavailable_when_no_key(self):
        resp = self.client.get(reverse("movie-trailer", args=[self.m1.id]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data["available"])

    def test_interact_requires_auth(self):
        resp = self.client.post(reverse("movie-interact", args=[self.m1.id]), {"kind": "view"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_top_rated_endpoint(self):
        resp = self.client.get(reverse("movie-top-rated"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_new_releases_endpoint(self):
        resp = self.client.get(reverse("movie-new-releases"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_bollywood_endpoint(self):
        resp = self.client.get(reverse("movie-bollywood"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("trending", resp.data)
        self.assertIn("featured_actors", resp.data)

    def test_hollywood_endpoint(self):
        resp = self.client.get(reverse("movie-hollywood"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("trending", resp.data)
        self.assertIn("featured_actors", resp.data)

    def test_rate_movie_authenticated(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user("rater", "r@ex.com", "pass123")
        self.client.force_authenticate(user)
        resp = self.client.post(reverse("movie-rate", args=[self.m1.id]), {"rating": 9, "title": "Incredible!"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["rating"], 9)

    def test_admin_stats_endpoint(self):
        resp = self.client.get(reverse("admin-stats"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("metrics", resp.data)
        self.assertIn("total_movies", resp.data["metrics"])

    def test_person_detail_endpoint(self):
        resp = self.client.get(reverse("movie-person", args=["Test Director"]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Test Director")
        self.assertIn("Director", resp.data["roles"])
        self.assertGreaterEqual(resp.data["total_credits"], 1)

    def test_regional_cinema_endpoint(self):
        resp = self.client.get(reverse("movie-regional"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("trending", resp.data)
        self.assertIn("tamil", resp.data)
        self.assertIn("telugu", resp.data)
        self.assertIn("featured_legends", resp.data)




class FlickRateScoreTests(APITestCase):
    def test_score_blends_available_signals(self):
        score = compute_flickrate_score(
            imdb_rating=8.0, rotten_tomatoes=90, user_rating_avg=7.0, popularity=50,
        )
        self.assertIsNotNone(score)
        self.assertGreaterEqual(score, Decimal("0.0"))
        self.assertLessEqual(score, Decimal("10.0"))

    def test_score_renormalizes_when_data_missing(self):
        # Only IMDb rating available (e.g. no RT data for a regional film) —
        # score should still be computed, not None, and stay close to IMDb rating.
        score = compute_flickrate_score(
            imdb_rating=8.0, rotten_tomatoes=None, user_rating_avg=None, popularity=None,
        )
        self.assertIsNotNone(score)
        self.assertAlmostEqual(float(score), 8.0, delta=0.1)

    def test_score_none_when_no_data_at_all(self):
        score = compute_flickrate_score(None, None, None, None)
        self.assertIsNone(score)
