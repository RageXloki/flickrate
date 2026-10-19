from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.movies.models import Movie
from .models import WatchlistEntry
from .serializers import WatchlistEntrySerializer, WatchedMovieSerializer, CustomListSerializer


class WatchlistListView(generics.ListAPIView):
    """GET /api/watchlist/"""

    serializer_class = WatchlistEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WatchlistEntry.objects.filter(user=self.request.user).select_related("movie")


class WatchlistToggleView(APIView):
    """POST /api/watchlist/:movie_id/  -> add
       DELETE /api/watchlist/:movie_id/  -> remove"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, movie_id):
        try:
            movie = Movie.objects.get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        entry, created = WatchlistEntry.objects.get_or_create(user=request.user, movie=movie)
        return Response(
            WatchlistEntrySerializer(entry).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, movie_id):
        deleted, _ = WatchlistEntry.objects.filter(user=request.user, movie_id=movie_id).delete()
        if not deleted:
            return Response({"detail": "Not in watchlist."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WatchedMovieListView(generics.ListAPIView):
    """GET /api/watchlist/watched/"""

    serializer_class = WatchedMovieSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models import WatchedMovie
        return WatchedMovie.objects.filter(user=self.request.user).select_related("movie")


class WatchedMovieToggleView(APIView):
    """POST /api/watchlist/watched/:movie_id/ -> mark as watched
       DELETE /api/watchlist/watched/:movie_id/ -> unmark"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, movie_id):
        from .models import WatchedMovie
        try:
            movie = Movie.objects.get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        entry, created = WatchedMovie.objects.get_or_create(user=request.user, movie=movie)
        # If user marked watched, automatically track viewing interaction
        from apps.movies.models import MovieInteraction
        MovieInteraction.objects.create(user=request.user, movie=movie, kind=MovieInteraction.Kind.VIEW)

        return Response(
            WatchedMovieSerializer(entry).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, movie_id):
        from .models import WatchedMovie
        deleted, _ = WatchedMovie.objects.filter(user=request.user, movie_id=movie_id).delete()
        if not deleted:
            return Response({"detail": "Movie not in watched history."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Custom Lists Views ---

class CustomListListCreateView(generics.ListCreateAPIView):
    """GET /api/lists/ and POST /api/lists/"""

    serializer_class = CustomListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        from django.db.models import Q
        from .models import CustomList
        user = self.request.user
        if user.is_authenticated:
            return CustomList.objects.filter(Q(is_private=False) | Q(user=user)).prefetch_related("items__movie")
        return CustomList.objects.filter(is_private=False).prefetch_related("items__movie")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CustomListDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/lists/:id/"""

    serializer_class = CustomListSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        from django.db.models import Q
        from .models import CustomList
        user = self.request.user
        if user.is_authenticated:
            return CustomList.objects.filter(Q(is_private=False) | Q(user=user)).prefetch_related("items__movie")
        return CustomList.objects.filter(is_private=False).prefetch_related("items__movie")

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot edit someone else's list.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot delete someone else's list.")
        instance.delete()


class CustomListMovieToggleView(APIView):
    """POST /api/lists/:id/movies/:movie_id/ -> add movie
       DELETE /api/lists/:id/movies/:movie_id/ -> remove movie"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, movie_id):
        from .models import CustomList, CustomListItem
        try:
            clist = CustomList.objects.get(pk=pk)
        except CustomList.DoesNotExist:
            return Response({"detail": "Custom list not found."}, status=404)

        if clist.user_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=403)

        try:
            movie = Movie.objects.get(pk=movie_id)
        except Movie.DoesNotExist:
            return Response({"detail": "Movie not found."}, status=404)

        notes = request.data.get("notes", "")
        item, created = CustomListItem.objects.get_or_create(custom_list=clist, movie=movie, defaults={"notes": notes})
        clist.save()  # update updated_at timestamp

        return Response(CustomListSerializer(clist, context={"request": request}).data, status=201 if created else 200)

    def delete(self, request, pk, movie_id):
        from .models import CustomList, CustomListItem
        try:
            clist = CustomList.objects.get(pk=pk)
        except CustomList.DoesNotExist:
            return Response({"detail": "Custom list not found."}, status=404)

        if clist.user_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=403)

        deleted, _ = CustomListItem.objects.filter(custom_list=clist, movie_id=movie_id).delete()
        if not deleted:
            return Response({"detail": "Movie not in custom list."}, status=404)

        clist.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

