export interface Genre {
  id: number;
  name: string;
}

export interface MovieListItem {
  id: number;
  title: string;
  year: number | null;
  poster_url: string;
  backdrop_url: string;
  genres: Genre[];
  imdb_rating: number | null;
  rotten_tomatoes_rating: number | null;
  flickrate_score: number | null;
  industry: "hollywood" | "bollywood" | "indian_regional" | "other";
  popularity: number;
}

export interface CastMember {
  id?: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface CrewMember {
  name: string;
  job: string;
  department: string;
}

export interface MovieVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CriticReview {
  author: string;
  publication: string;
  content: string;
  url: string;
  date: string;
}

export interface MovieDetail extends Omit<MovieListItem, "backdrop_url"> {
  tmdb_id: number | null;
  imdb_id: string;
  original_title: string;
  tagline: string;
  overview: string;
  release_date: string | null;
  runtime_minutes: number | null;
  original_language: string;
  spoken_languages: string[];
  country: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url: string | null;
  trailer_youtube_key?: string | null;
  director: string;
  writers?: string[];
  cast: string[];
  cast_details?: CastMember[];
  crew_details?: CrewMember[];
  production_companies?: string[];
  certification?: string;
  budget?: number | null;
  revenue?: number | null;
  awards?: string;
  metascore?: number | null;
  videos?: MovieVideo[];
  external_links?: Record<string, string>;
  critic_reviews?: CriticReview[];
  keywords: string[];
  imdb_votes: number | null;
  review_count: number;
  rating_distribution?: Record<string, number>;
  user_rating_avg?: number | null;
  user_rating?: number | null;
}

export interface Review {
  id: number;
  movie: number;
  username: string;
  avatar_url: string;
  rating: number;
  title: string;
  body: string;
  is_spoiler: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
}

export interface WatchlistEntry {
  id: number;
  movie: MovieListItem;
  created_at: string;
}

export interface WatchedMovieEntry {
  id: number;
  movie: MovieListItem;
  watched_date: string;
  created_at: string;
}

export interface CustomListItem {
  id: number;
  movie: MovieListItem;
  notes: string;
  added_at: string;
}

export interface CustomList {
  id: number;
  user: number;
  username: string;
  title: string;
  description: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  items: CustomListItem[];
  item_count: number;
  is_owner: boolean;
}

export interface PersonDetail {
  name: string;
  roles: string[];
  profile_image: string;
  total_credits: number;
  directing_credits: MovieListItem[];
  acting_credits: MovieListItem[];
  top_works: MovieListItem[];
}

export interface Recommendation {
  movie: MovieListItem;
  score: number;
  reasons: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  favorite_genres: string[];
  preferred_languages?: string[];
  preferred_industries?: string[];
  is_staff?: boolean;
  date_joined: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AssistantResponse {
  mode: "llm" | "deterministic" | "none";
  explanation: string;
  filters: Record<string, unknown>;
  results: MovieListItem[];
}

export interface FeaturedPerson {
  name: string;
  role?: string;
  hits?: string[];
  movies?: string[];
}

export interface BollywoodData {
  trending: MovieListItem[];
  top_rated: MovieListItem[];
  recent: MovieListItem[];
  classics: MovieListItem[];
  regional: MovieListItem[];
  featured_actors: FeaturedPerson[];
  featured_directors: FeaturedPerson[];
}

export interface HollywoodData {
  trending: MovieListItem[];
  top_rated: MovieListItem[];
  recent: MovieListItem[];
  classics: MovieListItem[];
  featured_actors: FeaturedPerson[];
  featured_directors: FeaturedPerson[];
}

export interface RegionalData {
  trending: MovieListItem[];
  top_rated: MovieListItem[];
  recent: MovieListItem[];
  tamil: MovieListItem[];
  telugu: MovieListItem[];
  malayalam: MovieListItem[];
  kannada: MovieListItem[];
  featured_legends: Array<{ name: string; industry: string; movies: string[] }>;
  visionary_directors: Array<{ name: string; industry: string; movies: string[] }>;
}

export interface MoodItem {
  key: string;
  label: string;
  tone: string;
}

export interface MoodData {
  mood: string;
  mood_label: string;
  tone: string;
  results: Recommendation[];
  available_moods: MoodItem[];
}

export interface AdminStats {
  metrics: {
    total_users: number;
    total_movies: number;
    total_reviews: number;
    total_ratings: number;
    total_watchlist: number;
  };
  industry_distribution: Record<string, number>;
  genre_distribution: Array<{ id: number; name: string; movie_count: number }>;
  most_viewed: MovieListItem[];
  most_rated: MovieListItem[];
  recent_searches: Array<{ query: string; results_count: number; created_at: string }>;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  date_joined: string;
  is_staff: boolean;
  reviews_count: number;
  watchlist_count: number;
}

export interface AdminReview {
  id: number;
  movie_id: number;
  movie_title: string;
  username: string;
  rating: number;
  title: string;
  body: string;
  helpful_count: number;
  report_count?: number;
  created_at: string;
}
