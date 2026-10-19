from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.movies.models import Movie

User = get_user_model()


class ReviewTests(APITestCase):
    def setUp(self):
        self.movie = Movie.objects.create(title="Reviewable Movie", release_date=date(2020, 1, 1))
        self.user = User.objects.create_user(username="reviewer", email="rv@example.com", password="StrongPass123!")
        self.other_user = User.objects.create_user(username="other", email="ot@example.com", password="StrongPass123!")

    def test_create_review_requires_auth(self):
        resp = self.client.post(
            reverse("movie-reviews", args=[self.movie.id]),
            {"rating": 8, "title": "Great", "body": "Loved it."},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_review_authenticated(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post(
            reverse("movie-reviews", args=[self.movie.id]),
            {"rating": 8, "title": "Great", "body": "Loved it."},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.movie.refresh_from_db()
        self.assertIsNotNone(self.movie.flickrate_score)

    def test_cannot_review_same_movie_twice(self):
        self.client.force_authenticate(self.user)
        self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 8, "body": "x"})
        resp = self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 5, "body": "y"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_owner_can_edit_review(self):
        self.client.force_authenticate(self.user)
        create = self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 8, "body": "x"})
        review_id = create.data["id"]

        self.client.force_authenticate(self.other_user)
        resp = self.client.patch(reverse("review-detail", args=[review_id]), {"rating": 1})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_delete_review(self):
        self.client.force_authenticate(self.user)
        create = self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 8, "body": "x"})
        review_id = create.data["id"]
        resp = self.client.delete(reverse("review-detail", args=[review_id]))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_mark_helpful_increments_once_per_user(self):
        self.client.force_authenticate(self.user)
        create = self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 8, "body": "x"})
        review_id = create.data["id"]

        self.client.force_authenticate(self.other_user)
        resp1 = self.client.post(reverse("review-helpful", args=[review_id]))
        resp2 = self.client.post(reverse("review-helpful", args=[review_id]))
        self.assertEqual(resp1.data["helpful_count"], 1)
        self.assertEqual(resp2.data["helpful_count"], 1)  # idempotent, not double-counted

    def test_reviews_sort_by_highest_rated(self):
        m2 = Movie.objects.create(title="Another", release_date=date(2021, 1, 1))
        self.client.force_authenticate(self.user)
        self.client.post(reverse("movie-reviews", args=[m2.id]), {"rating": 3, "body": "meh"})
        self.client.force_authenticate(self.other_user)
        self.client.post(reverse("movie-reviews", args=[m2.id]), {"rating": 9, "body": "great"})

        resp = self.client.get(reverse("movie-reviews", args=[m2.id]), {"sort": "highest_rated"})
        ratings = [r["rating"] for r in resp.data["results"]] if "results" in resp.data else [r["rating"] for r in resp.data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_create_review_with_spoiler_flag(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post(
            reverse("movie-reviews", args=[self.movie.id]),
            {"rating": 9, "title": "Big Twist", "body": "The hero was a ghost!", "is_spoiler": True},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data["is_spoiler"])

    def test_report_review(self):
        self.client.force_authenticate(self.user)
        create = self.client.post(reverse("movie-reviews", args=[self.movie.id]), {"rating": 8, "body": "spoiler info"})
        review_id = create.data["id"]

        self.client.force_authenticate(self.other_user)
        report_resp = self.client.post(
            reverse("review-report", args=[review_id]),
            {"reason": "spoiler", "details": "Reveals the ending without warning"},
        )
        self.assertEqual(report_resp.status_code, status.HTTP_201_CREATED)

