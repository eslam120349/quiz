import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "@/pages/Dashboard";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "teacher@example.com", user_metadata: { name: "Teacher" } },
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/services/quizzes", () => ({
  listQuizzes: vi.fn().mockResolvedValue([]),
}));

const renderWithProviders = (ui: React.ReactElement, initialEntries = ["/dashboard"]) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/dashboard" element={ui} />
          <Route path="/quizzes/new" element={<div>NEW QUIZ PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Dashboard buttons navigation", () => {
  it("navigates to create quiz on click", async () => {
    renderWithProviders(<Dashboard />);
    const newBtn = screen.getByRole("button", { name: /اختبار جديد/i });
    fireEvent.click(newBtn);
    expect(await screen.findByText("NEW QUIZ PAGE")).toBeInTheDocument();
  });

  it("navigates to create quiz on touch end", async () => {
    renderWithProviders(<Dashboard />);
    const emptyCta = await screen.findByRole("button", { name: /إنشاء أول اختبار/i });
    fireEvent.touchEnd(emptyCta);
    expect(await screen.findByText("NEW QUIZ PAGE")).toBeInTheDocument();
  });
});
