import { api } from "./apiClient";
import type {
  AssistantResponse,
  CustomList,
  Paginated,
  Recommendation,
  Review,
  WatchedMovieEntry,
  WatchlistEntry,
} from "@/types";

// --- Reviews ---
export async function fetchMovieReviews(
  movieId: number,
  sort: "newest" | "oldest" | "highest_rated" | "lowest_rated" | "most_helpful" = "newest"
) {
  const { data } = await api.get<Paginated<Review> | Review[]>(`/movies/${movieId}/reviews/`, { params: { sort } });
  return Array.isArray(data) ? data : data.results;
}

export async function createReview(
  movieId: number,
  rating: number,
  title: string,
  body: string,
  is_spoiler = false
): Promise<Review> {
  const { data } = await api.post<Review>(`/movies/${movieId}/reviews/`, {
    movie: movieId,
    rating,
    title,
    body,
    is_spoiler,
  });
  return data;
}

export async function updateReview(
  reviewId: number,
  patch: Partial<Pick<Review, "rating" | "title" | "body" | "is_spoiler">>
): Promise<Review> {
  const { data } = await api.patch<Review>(`/reviews/${reviewId}/`, patch);
  return data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await api.delete(`/reviews/${reviewId}/`);
}

export async function markReviewHelpful(reviewId: number): Promise<{ helpful_count: number }> {
  const { data } = await api.post(`/reviews/${reviewId}/helpful/`);
  return data;
}

// --- Watchlist ---
export async function fetchWatchlist(): Promise<WatchlistEntry[]> {
  const { data } = await api.get<Paginated<WatchlistEntry> | WatchlistEntry[]>("/watchlist/");
  return Array.isArray(data) ? data : data.results;
}

export async function addToWatchlist(movieId: number): Promise<WatchlistEntry> {
  const { data } = await api.post<WatchlistEntry>(`/watchlist/${movieId}/`);
  return data;
}

export async function removeFromWatchlist(movieId: number): Promise<void> {
  await api.delete(`/watchlist/${movieId}/`);
}

// --- Watched Movies / Viewing History ---
export async function fetchWatchedMovies(): Promise<WatchedMovieEntry[]> {
  const { data } = await api.get<Paginated<WatchedMovieEntry> | WatchedMovieEntry[]>("/watchlist/watched/");
  return Array.isArray(data) ? data : data.results;
}

export async function markMovieWatched(movieId: number): Promise<WatchedMovieEntry> {
  const { data } = await api.post<WatchedMovieEntry>(`/watchlist/watched/${movieId}/`);
  return data;
}

export async function unmarkMovieWatched(movieId: number): Promise<void> {
  await api.delete(`/watchlist/watched/${movieId}/`);
}

// --- Custom Lists ---
export async function fetchCustomLists(): Promise<CustomList[]> {
  const { data } = await api.get<Paginated<CustomList> | CustomList[]>("/lists/");
  return Array.isArray(data) ? data : data.results;
}

export async function fetchCustomList(id: number): Promise<CustomList> {
  const { data } = await api.get<CustomList>(`/lists/${id}/`);
  return data;
}

export async function createCustomList(
  title: string,
  description = "",
  is_private = false
): Promise<CustomList> {
  const { data } = await api.post<CustomList>("/lists/", { title, description, is_private });
  return data;
}

export async function updateCustomList(
  id: number,
  patch: Partial<Pick<CustomList, "title" | "description" | "is_private">>
): Promise<CustomList> {
  const { data } = await api.patch<CustomList>(`/lists/${id}/`, patch);
  return data;
}

export async function deleteCustomList(id: number): Promise<void> {
  await api.delete(`/lists/${id}/`);
}

export async function addMovieToCustomList(
  listId: number,
  movieId: number,
  notes = ""
): Promise<CustomList> {
  const { data } = await api.post<CustomList>(`/lists/${listId}/movies/${movieId}/`, { notes });
  return data;
}

export async function removeMovieFromCustomList(listId: number, movieId: number): Promise<void> {
  await api.delete(`/lists/${listId}/movies/${movieId}/`);
}

// --- Recommendations ---
export async function fetchSimilarMovies(movieId: number): Promise<{ seed_movie: string; results: Recommendation[] }> {
  const { data } = await api.get("/recommendations/", { params: { movie_id: movieId } });
  return data;
}

export async function fetchPersonalizedRecommendations(): Promise<{ personalized: boolean; message: string | null; results: Recommendation[] }> {
  const { data } = await api.get("/recommendations/personalized/");
  return data;
}

// --- AI Assistant ---
export async function askAssistant(query: string): Promise<AssistantResponse> {
  const { data } = await api.post<AssistantResponse>("/assistant/", { query });
  return data;
}
