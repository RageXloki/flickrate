from django.contrib import admin
from .models import Review, ReviewHelpfulVote


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "movie", "rating", "helpful_count", "created_at")
    list_filter = ("rating",)
    search_fields = ("user__username", "movie__title", "body")


admin.site.register(ReviewHelpfulVote)
