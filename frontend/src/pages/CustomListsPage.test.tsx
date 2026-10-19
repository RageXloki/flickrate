import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CustomListsPage } from "./CustomListsPage";
import * as interactionService from "@/services/interactionService";
import { AuthProvider } from "@/context/AuthContext";
import type { CustomList } from "@/types";

const mockLists: CustomList[] = [
  {
    id: 1,
    user: 5,
    username: "cinemaphile",
    title: "Best Psychological Thrillers",
    description: "Mind-bending masterpieces with twist endings",
    is_private: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    items: [],
    item_count: 8,
    is_owner: false,
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("CustomListsPage", () => {
  beforeEach(() => {
    vi.spyOn(interactionService, "fetchCustomLists").mockResolvedValue(mockLists);
  });

  it("renders custom movie lists and creator attribution", async () => {
    renderWithRouter(<CustomListsPage />);
    expect(screen.getByText(/Community Movie Lists/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Best Psychological Thrillers")).toBeInTheDocument();
      expect(screen.getByText(/Mind-bending masterpieces/i)).toBeInTheDocument();
      expect(screen.getByText("cinemaphile")).toBeInTheDocument();
    });
  });
});
