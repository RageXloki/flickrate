import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingBadges } from "./RatingBadges";

describe("RatingBadges", () => {
  it("renders all three provided ratings", () => {
    render(<RatingBadges imdb={9.0} rottenTomatoes={94} flickrate={9.5} />);
    expect(screen.getByText("9.0")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("9.5")).toBeInTheDocument();
  });

  it("never fabricates a Rotten Tomatoes score when unavailable", () => {
    render(<RatingBadges imdb={9.0} rottenTomatoes={null} flickrate={9.5} />);
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("renders an em dash when FlickRate score is not yet computed", () => {
    render(<RatingBadges imdb={null} rottenTomatoes={null} flickrate={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
