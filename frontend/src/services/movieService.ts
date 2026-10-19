import { api } from "./apiClient";
import type { Genre, MovieDetail, MovieListItem, Paginated } from "@/types";

export interface MovieQueryParams {
  search?: string;
  genre?: string;
  year?: number;
  year_min?: number;
  year_max?: number;
  language?: string;
  country?: string;
  industry?: string;
  min_rating?: number;
  sort?: "popularity" | "newest" | "imdb" | "rotten_tomatoes" | "flickrate";
  page?: number;
}

export async function fetchMovies(params: MovieQueryParams = {}): Promise<Paginated<MovieListItem>> {
  const { data } = await api.get<Paginated<MovieListItem>>("/movies/", { params });
  return data;
}

export async function fetchMovie(id: number | string): Promise<MovieDetail> {
  const { data } = await api.get<MovieDetail>(`/movies/${id}/`);
  return data;
}

export interface SearchResponse {
  local_results: MovieListItem[];
  tmdb_suggestions: Array<{ tmdb_id: number; title: string; year: string; poster_url: string }>;
}

export async function searchMovies(query: string): Promise<SearchResponse> {
  if (!query.trim()) return { local_results: [], tmdb_suggestions: [] };
  const { data } = await api.get<SearchResponse>("/movies/search/", { params: { q: query } });
  return data;
}

export async function fetchTrending(): Promise<MovieListItem[]> {
  const { data } = await api.get<MovieListItem[]>("/movies/trending/");
  return data;
}

export async function fetchPopular(): Promise<MovieListItem[]> {
  const { data } = await api.get<MovieListItem[]>("/movies/popular/");
  return data;
}

export async function fetchGenres(): Promise<Genre[]> {
  const { data } = await api.get<Paginated<Genre> | Genre[]>("/movies/genres/");
  return Array.isArray(data) ? data : data.results;
}

export async function fetchTrailer(id: number): Promise<{ available: boolean; url: string | null }> {
  const { data } = await api.get(`/movies/${id}/trailer/`);
  return data;
}

export async function trackInteraction(id: number, kind: "view" | "like" | "click"): Promise<void> {
  await api.post(`/movies/${id}/interact/`, { kind });
}

export async function fetchTopRated(): Promise<MovieListItem[]> {
  const { data } = await api.get<MovieListItem[]>("/movies/top-rated/");
  return data;
}

export async function fetchNewReleases(): Promise<MovieListItem[]> {
  const { data } = await api.get<MovieListItem[]>("/movies/new-releases/");
  return data;
}

export async function fetchBollywoodData(): Promise<import("@/types").BollywoodData> {
  const { data } = await api.get<import("@/types").BollywoodData>("/movies/bollywood/");
  return data;
}

export async function fetchHollywoodData(): Promise<import("@/types").HollywoodData> {
  const { data } = await api.get<import("@/types").HollywoodData>("/movies/hollywood/");
  return data;
}

export async function rateMovieDirect(
  movieId: number,
  rating: number,
  title = "",
  body = ""
): Promise<{ detail: string; rating: number; flickrate_score: number; review_id: number }> {
  const { data } = await api.post(`/movies/${movieId}/rate/`, { rating, title, body });
  return data;
}

export async function fetchMoodRecommendations(mood = "happy"): Promise<import("@/types").MoodData> {
  const { data } = await api.get<import("@/types").MoodData>("/recommendations/mood/", {
    params: { mood },
  });
  return data;
}

// --- Admin APIs ---

export async function fetchAdminStats(): Promise<import("@/types").AdminStats> {
  const { data } = await api.get<import("@/types").AdminStats>("/movies/admin/stats/");
  return data;
}

export async function fetchAdminUsers(): Promise<import("@/types").AdminUser[]> {
  const { data } = await api.get<import("@/types").AdminUser[]>("/movies/admin/users/");
  return data;
}

export async function fetchAdminReviews(): Promise<import("@/types").AdminReview[]> {
  const { data } = await api.get<import("@/types").AdminReview[]>("/movies/admin/reviews/");
  return data;
}

export async function deleteAdminReview(reviewId: number): Promise<{ detail: string }> {
  const { data } = await api.delete<{ detail: string }>(`/movies/admin/reviews/${reviewId}/`);
  return data;
}

export async function syncMovieAdmin(tmdb_id: number): Promise<{ detail: string; movie?: MovieDetail }> {
  const { data } = await api.post<{ detail: string; movie?: MovieDetail }>("/movies/admin/sync/", {
    tmdb_id,
  });
  return data;
}

export async function fetchRegionalData(): Promise<import("@/types").RegionalData> {
  const { data } = await api.get<import("@/types").RegionalData>("/movies/regional/");
  return data;
}

export async function fetchPersonDetail(name: string): Promise<import("@/types").PersonDetail> {
  const { data } = await api.get<import("@/types").PersonDetail>(`/movies/person/${encodeURIComponent(name)}/`);
  return data;
}

export async function reportReview(
  reviewId: number,
  reason: string,
  details = ""
): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>(`/reviews/${reviewId}/report/`, {
    reason,
    details,
  });
  return data;
}


