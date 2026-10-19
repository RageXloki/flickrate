import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MovieCard } from "./MovieCard";
import type { MovieListItem } from "@/types";

const mockMovie: MovieListItem = {
  id: 1,
  title: "The Dark Knight",
  year: 2008,
  poster_url: "",
  backdrop_url: "",
  genres: [{ id: 1, name: "Action" }],
  imdb_rating: 9.0,
  rotten_tomatoes_rating: 94,
  flickrate_score: 9.5,
  industry: "hollywood",
  popularity: 500,
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("MovieCard", () => {
  it("renders the movie title and year", () => {
    renderWithRouter(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("The Dark Knight")).toBeInTheDocument();
    expect(screen.getByText("2008")).toBeInTheDocument();
  });

  it("renders IMDb, Rotten Tomatoes, and FlickRate ratings", () => {
    renderWithRouter(<MovieCard movie={mockMovie} />);
    expect(screen.getByText("9.0")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("9.5")).toBeInTheDocument();
  });

  it("shows 'Not available' when a rating is missing", () => {
    renderWithRouter(<MovieCard movie={{ ...mockMovie, rotten_tomatoes_rating: null }} />);
    expect(screen.getByText("Not available")).toBeInTheDocument();
  });

  it("links to the movie detail page", () => {
    renderWithRouter(<MovieCard movie={mockMovie} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/movies/1");
  });
});
