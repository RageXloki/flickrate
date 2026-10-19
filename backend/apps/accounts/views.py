from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer, UserSerializer, FlickRateTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  -> {access, refresh, user}"""

    permission_classes = [permissions.AllowAny]
    serializer_class = FlickRateTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/"""

    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET/PATCH /api/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"detail": "User account and all personal data deleted successfully."}, status=status.HTTP_204_NO_CONTENT)



class LogoutView(APIView):
    """POST /api/auth/logout/  body: {refresh}

    Blacklists the refresh token so it can no longer be used, which is the
    standard way to implement 'logout' with stateless JWT access tokens.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_205_RESET_CONTENT)
