import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AdminDashboardPage } from "./AdminDashboardPage";
import * as movieService from "@/services/movieService";
import type { AdminStats, AdminUser, AdminReview } from "@/types";

const mockStats: AdminStats = {
  metrics: {
    total_users: 15,
    total_movies: 27,
    total_reviews: 42,
    total_ratings: 120,
    total_watchlist: 65,
  },
  industry_distribution: { hollywood: 14, bollywood: 9, regional: 4 },
  genre_distribution: [
    { id: 1, name: "Action", movie_count: 8 },
    { id: 2, name: "Drama", movie_count: 12 },
  ],
  most_viewed: [
    {
      id: 1,
      title: "Interstellar",
      year: 2014,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Sci-Fi" }],
      imdb_rating: 8.7,
      rotten_tomatoes_rating: 73,
      flickrate_score: 8.8,
      industry: "hollywood",
      popularity: 620,
    },
  ],
  most_rated: [
    {
      id: 2,
      title: "The Dark Knight",
      year: 2008,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Action" }],
      imdb_rating: 9.0,
      rotten_tomatoes_rating: 94,
      flickrate_score: 9.5,
      industry: "hollywood",
      popularity: 700,
    },
  ],
  recent_searches: [
    { query: "Nolan sci-fi", results_count: 3, created_at: "2026-03-01T12:00:00Z" },
  ],
};

const mockUsers: AdminUser[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@flickrate.dev",
    is_staff: true,
    date_joined: "2026-01-01",
    reviews_count: 5,
    watchlist_count: 12,
  },
];

const mockReviews: AdminReview[] = [
  {
    id: 10,
    username: "demouser",
    movie_id: 1,
    movie_title: "Interstellar",
    rating: 10,
    title: "Masterpiece",
    body: "Incredible film experience",
    helpful_count: 3,
    created_at: "2026-02-01",
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchAdminStats").mockResolvedValue(mockStats);
    vi.spyOn(movieService, "fetchAdminUsers").mockResolvedValue(mockUsers);
    vi.spyOn(movieService, "fetchAdminReviews").mockResolvedValue(mockReviews);
  });

  it("renders telemetry KPIs and review moderation", async () => {
    renderWithRouter(<AdminDashboardPage />);
    expect(screen.getByText(/Admin & Analytics Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Live Movie Ingest & Sync")).toBeInTheDocument();
      expect(screen.getByText(/Review Moderation/i)).toBeInTheDocument();
      expect(screen.getByText(/User Accounts/i)).toBeInTheDocument();
    });
  });
});
