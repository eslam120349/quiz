import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "@/pages/Dashboard";
import QuizNew from "@/pages/QuizNew";
import { Toaster } from "@/components/ui/toaster";

// Simple in-memory store to reflect created quizzes in list
type QuizItem = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  questionType: "multiple_choice" | "essay" | "mixed";
  owner_id: string;
  created_at: string;
};
const memory: QuizItem[] = [];

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "teacher@example.com", user_metadata: { name: "Teacher" } },
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/services/quizzes", async () => {
  return {
    createQuiz: vi.fn().mockImplementation(async (payload: { name: string; description: string; durationMinutes: number; questionType: "multiple_choice" | "essay" | "mixed"; owner_id: string }) => {
      const item = {
        id: "q-1",
        name: payload.name,
        description: payload.description,
        durationMinutes: payload.durationMinutes,
        questionType: payload.questionType,
        owner_id: payload.owner_id,
        created_at: new Date().toISOString(),
      };
      memory.unshift(item);
      return item;
    }),
    listQuizzes: vi.fn().mockImplementation(async (_ownerId: string) => {
      return memory.slice();
    }),
  };
});

const renderWithProviders = (initialEntries = ["/quizzes/new"]) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quizzes/new" element={<QuizNew />} />
        </Routes>
      </MemoryRouter>
      <Toaster />
    </QueryClientProvider>
  );
};

describe("Create quiz flow", () => {
  it("creates a quiz and shows it in dashboard list", async () => {
    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/اسم الاختبار/i), { target: { value: "اختبار الرياضيات" } });
    fireEvent.change(screen.getByLabelText(/الوصف/i), { target: { value: "وصف قصير" } });
    fireEvent.change(screen.getByLabelText(/المدة بالدقائق/i), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: /حفظ الاختبار/i }));

    // Success toast
    expect(await screen.findByText(/تم إنشاء الاختبار بنجاح/i)).toBeInTheDocument();

    // Navigates to dashboard and shows the new quiz
    await waitFor(async () => {
      expect(await screen.findByText("اختبار الرياضيات")).toBeInTheDocument();
    });
  });
});
