import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { HollywoodPage } from "./HollywoodPage";
import * as movieService from "@/services/movieService";
import type { HollywoodData } from "@/types";

const mockHollywoodData: HollywoodData = {
  trending: [
    {
      id: 301,
      title: "Interstellar",
      year: 2014,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Sci-Fi" }, { id: 2, name: "Adventure" }],
      imdb_rating: 8.7,
      rotten_tomatoes_rating: 73,
      flickrate_score: 8.8,
      industry: "hollywood",
      popularity: 620,
    },
  ],
  top_rated: [],
  recent: [],
  classics: [],
  featured_actors: [
    { name: "Leonardo DiCaprio", role: "Leading Actor", movies: ["Inception", "Titanic"] },
  ],
  featured_directors: [
    { name: "Christopher Nolan", role: "Director & Visionary", movies: ["Oppenheimer", "The Dark Knight"] },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("HollywoodPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchHollywoodData").mockResolvedValue(mockHollywoodData);
  });

  it("renders Hollywood cinema hero and spotlight cards", async () => {
    renderWithRouter(<HollywoodPage />);
    expect(screen.getByText(/Hollywood Spotlight/i)).toBeInTheDocument();

    await waitFor(() => {
      const titles = screen.getAllByText("Interstellar");
      expect(titles.length).toBeGreaterThan(0);
      expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
      expect(screen.getByText("Leonardo DiCaprio")).toBeInTheDocument();
    });
  });
});
