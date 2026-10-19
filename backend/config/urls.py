from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from apps.reviews.urls import movie_nested_urlpatterns as movie_review_urls

def api_root(request):
    return JsonResponse({
        "status": "online",
        "service": "FlickRate API Backend",
        "frontend_app": "http://localhost:5173",
        "endpoints": {
            "movies": "/api/movies/",
            "genres": "/api/movies/genres/",
            "auth": "/api/auth/login/",
            "recommendations": "/api/recommendations/?movie_id=1",
            "assistant": "/api/assistant/",
            "admin": "/admin/",
        }
    })

urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/movies/", include("apps.movies.urls")),
    path("api/movies/", include(movie_review_urls)),  # /api/movies/:id/reviews/
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/watchlist/", include("apps.watchlist.urls")),
    path("api/lists/", include("apps.watchlist.lists_urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/assistant/", include("apps.assistant.urls")),
]
