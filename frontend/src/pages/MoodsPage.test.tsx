import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MoodsPage } from "./MoodsPage";
import * as movieService from "@/services/movieService";
import type { MoodData } from "@/types";

const mockMoodData: MoodData = {
  mood: "happy",
  mood_label: "Feel-Good & Uplifting",
  tone: "Heartwarming, hilarious, and inspiring cinema to lift your spirits",
  available_moods: [
    { key: "happy", label: "Happy", tone: "Uplifting" },
    { key: "sad", label: "Sad", tone: "Melancholic" },
  ],
  results: [
    {
      movie: {
        id: 201,
        title: "Zindagi Na Milegi Dobara",
        year: 2011,
        poster_url: "",
        backdrop_url: "",
        genres: [{ id: 1, name: "Adventure" }, { id: 2, name: "Comedy" }],
        imdb_rating: 8.2,
        rotten_tomatoes_rating: 91,
        flickrate_score: 8.9,
        industry: "bollywood",
        popularity: 280,
      },
      score: 0.94,
      reasons: ["Feel-good friendship vibe", "Uplifting road trip adventure"],
    },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("MoodsPage", () => {
  beforeEach(() => {
    vi.spyOn(movieService, "fetchMoodRecommendations").mockResolvedValue(mockMoodData);
  });

  it("renders mood selection cards and recommendations", async () => {
    renderWithRouter(<MoodsPage />);
    expect(screen.getByText(/What are you in the mood for/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Zindagi Na Milegi Dobara")).toBeInTheDocument();
      expect(screen.getByText(/Happy Mood Spotlight/i)).toBeInTheDocument();
    });
  });
});
