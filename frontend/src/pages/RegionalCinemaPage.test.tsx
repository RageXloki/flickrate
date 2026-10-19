import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RegionalCinemaPage } from "./RegionalCinemaPage";
import * as movieService from "@/services/movieService";
import type { RegionalData } from "@/types";
import { AuthProvider } from "@/context/AuthContext";

const mockRegionalData: RegionalData = {
  trending: [
    {
      id: 201,
      title: "Kantara",
      year: 2022,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Action" }, { id: 2, name: "Drama" }],
      imdb_rating: 8.2,
      rotten_tomatoes_rating: 90,
      flickrate_score: 9.1,
      industry: "indian_regional",
      popularity: 420,
    },
  ],
  top_rated: [],
  recent: [],
  tamil: [
    {
      id: 202,
      title: "Vikram",
      year: 2022,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Action" }],
      imdb_rating: 8.3,
      rotten_tomatoes_rating: 92,
      flickrate_score: 9.2,
      industry: "indian_regional",
      popularity: 390,
    },
  ],
  telugu: [
    {
      id: 203,
      title: "RRR",
      year: 2022,
      poster_url: "",
      backdrop_url: "",
      genres: [{ id: 1, name: "Action" }],
      imdb_rating: 7.8,
      rotten_tomatoes_rating: 95,
      flickrate_score: 9.0,
      industry: "indian_regional",
      popularity: 500,
    },
  ],
  malayalam: [],
  kannada: [],
  featured_legends: [
    { name: "Kamal Haasan", industry: "Tamil & Pan-Indian Legend", movies: ["Vikram", "Nayagan", "Indian"] },
  ],
  visionary_directors: [
    { name: "S.S. Rajamouli", industry: "Telugu & Global Visionary", movies: ["RRR", "Baahubali"] },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("RegionalCinemaPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchRegionalData").mockResolvedValue(mockRegionalData);
  });

  it("renders regional cinema hero, language categories, and legends", async () => {
    renderWithRouter(<RegionalCinemaPage />);
    expect(screen.getByText(/Indian Regional Cinema/i)).toBeInTheDocument();

    await waitFor(() => {
      const kantaraElements = screen.getAllByText("Kantara");
      expect(kantaraElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Vikram")).toBeInTheDocument();
      expect(screen.getByText("RRR")).toBeInTheDocument();
      expect(screen.getByText("Kamal Haasan")).toBeInTheDocument();
      expect(screen.getByText("S.S. Rajamouli")).toBeInTheDocument();
    });
  });
});
