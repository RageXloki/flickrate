import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SearchResultsPage } from "./SearchResultsPage";
import * as movieService from "@/services/movieService";
import { AuthProvider } from "@/context/AuthContext";
import type { MovieListItem, Genre, Paginated } from "@/types";

const mockMovies: MovieListItem[] = [
  {
    id: 301,
    title: "Oppenheimer",
    year: 2023,
    poster_url: "",
    backdrop_url: "",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    imdb_rating: 8.9,
    rotten_tomatoes_rating: 93,
    flickrate_score: 9.4,
    industry: "hollywood",
    popularity: 450,
  },
];

const mockPaginated: Paginated<MovieListItem> = {
  count: 1,
  next: null,
  previous: null,
  results: mockMovies,
};

const mockGenres: Genre[] = [
  { id: 18, name: "Drama" },
  { id: 28, name: "Action" },
];

function renderWithRouter(ui: React.ReactElement, initialEntry = "/search?q=oppenheimer") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("SearchResultsPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchGenres").mockResolvedValue(mockGenres);
    vi.spyOn(movieService, "fetchMovies").mockResolvedValue(mockPaginated);
  });

  it("renders search interface and populated movie results", async () => {
    renderWithRouter(<SearchResultsPage />);
    expect(screen.getByText(/Search Movie Catalog/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText("Oppenheimer")).toBeInTheDocument();
        expect(screen.getByText(/Found/i)).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });
});
