from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_creates_user(self):
        resp = self.client.post(reverse("auth-register"), {
            "username": "reviewer1", "email": "r1@example.com",
            "password": "StrongPass123!", "password2": "StrongPass123!",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="reviewer1").exists())

    def test_register_rejects_mismatched_passwords(self):
        resp = self.client.post(reverse("auth-register"), {
            "username": "reviewer2", "email": "r2@example.com",
            "password": "StrongPass123!", "password2": "Different123!",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username="dupe", email="a@example.com", password="StrongPass123!")
        resp = self.client.post(reverse("auth-register"), {
            "username": "dupe", "email": "b@example.com",
            "password": "StrongPass123!", "password2": "StrongPass123!",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_user(self):
        User.objects.create_user(username="loginuser", email="l@example.com", password="StrongPass123!")
        resp = self.client.post(reverse("auth-login"), {"username": "loginuser", "password": "StrongPass123!"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["username"], "loginuser")

    def test_login_rejects_invalid_credentials(self):
        User.objects.create_user(username="loginuser2", email="l2@example.com", password="StrongPass123!")
        resp = self.client.post(reverse("auth-login"), {"username": "loginuser2", "password": "wrong"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        resp = self.client.get(reverse("auth-me"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user_when_authenticated(self):
        user = User.objects.create_user(username="me_user", email="m@example.com", password="StrongPass123!")
        self.client.force_authenticate(user=user)
        resp = self.client.get(reverse("auth-me"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "me_user")
