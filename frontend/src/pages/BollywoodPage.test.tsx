import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BollywoodPage } from "./BollywoodPage";
import * as movieService from "@/services/movieService";
import type { BollywoodData } from "@/types";

const mockBollywoodData: BollywoodData = {
  trending: [
    {
      id: 101,
      title: "3 Idiots",
      year: 2009,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Comedy" }, { id: 2, name: "Drama" }],
      imdb_rating: 8.4,
      rotten_tomatoes_rating: 100,
      flickrate_score: 9.3,
      industry: "bollywood",
      popularity: 350,
    },
  ],
  top_rated: [],
  regional: [],
  recent: [],
  classics: [],
  featured_actors: [
    { name: "Shah Rukh Khan", role: "Actor & Global Icon", movies: ["Swades", "Chak De! India"] },
  ],
  featured_directors: [
    { name: "Rajkumar Hirani", role: "Director", movies: ["3 Idiots", "PK"] },
  ],
};

import { AuthProvider } from "@/context/AuthContext";

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("BollywoodPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchBollywoodData").mockResolvedValue(mockBollywoodData);
  });

  it("renders Bollywood cinema hero and shelf content", async () => {
    renderWithRouter(<BollywoodPage />);
    expect(screen.getByText(/Bollywood & Indian Cinema/i)).toBeInTheDocument();

    await waitFor(() => {
      const titles = screen.getAllByText("3 Idiots");
      expect(titles.length).toBeGreaterThan(0);
      expect(screen.getByText("Shah Rukh Khan")).toBeInTheDocument();
      expect(screen.getByText("Rajkumar Hirani")).toBeInTheDocument();
    });
  });
});
