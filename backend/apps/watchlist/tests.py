from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.movies.models import Movie

User = get_user_model()


class WatchlistTests(APITestCase):
    def setUp(self):
        self.movie = Movie.objects.create(title="Watch Me", release_date=date(2020, 1, 1))
        self.user = User.objects.create_user(username="watcher", email="w@example.com", password="StrongPass123!")

    def test_list_requires_auth(self):
        resp = self.client.get(reverse("watchlist-list"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_and_list(self):
        self.client.force_authenticate(self.user)
        add_resp = self.client.post(reverse("watchlist-toggle", args=[self.movie.id]))
        self.assertEqual(add_resp.status_code, status.HTTP_201_CREATED)

        list_resp = self.client.get(reverse("watchlist-list"))
        self.assertEqual(len(list_resp.data["results"]) if "results" in list_resp.data else len(list_resp.data), 1)

    def test_add_twice_is_idempotent(self):
        self.client.force_authenticate(self.user)
        self.client.post(reverse("watchlist-toggle", args=[self.movie.id]))
        second = self.client.post(reverse("watchlist-toggle", args=[self.movie.id]))
        self.assertEqual(second.status_code, status.HTTP_200_OK)

    def test_remove(self):
        self.client.force_authenticate(self.user)
        self.client.post(reverse("watchlist-toggle", args=[self.movie.id]))
        remove_resp = self.client.delete(reverse("watchlist-toggle", args=[self.movie.id]))
        self.assertEqual(remove_resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_remove_when_not_present_404s(self):
        self.client.force_authenticate(self.user)
        resp = self.client.delete(reverse("watchlist-toggle", args=[self.movie.id]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_watched_movie_flow(self):
        self.client.force_authenticate(self.user)
        # Mark as watched
        resp = self.client.post(reverse("watched-toggle", args=[self.movie.id]))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # List watched
        list_resp = self.client.get(reverse("watched-list"))
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        items = list_resp.data.get("results", list_resp.data)
        self.assertEqual(len(items), 1)

        # Remove from watched
        del_resp = self.client.delete(reverse("watched-toggle", args=[self.movie.id]))
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_custom_lists_crud_and_permissions(self):
        self.client.force_authenticate(self.user)
        # Create list
        create_resp = self.client.post(
            reverse("custom-list-list-create"),
            {"title": "Sci-Fi Gems", "description": "Best cosmic adventures", "is_private": False},
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        list_id = create_resp.data["id"]

        # Add movie to list
        add_movie_resp = self.client.post(reverse("custom-list-movie-toggle", args=[list_id, self.movie.id]))
        self.assertEqual(add_movie_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(add_movie_resp.data["item_count"], 1)

        # Other user cannot edit or delete this list
        other_user = User.objects.create_user(username="intruder", email="i@example.com", password="StrongPass123!")
        self.client.force_authenticate(other_user)
        patch_resp = self.client.patch(reverse("custom-list-detail", args=[list_id]), {"title": "Hacked Title"})
        self.assertEqual(patch_resp.status_code, status.HTTP_403_FORBIDDEN)

