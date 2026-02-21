import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuizEditor from "@/pages/QuizEditor";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "t-1", email: "t@example.com" },
    loading: false,
  }),
}));

const mockListQuestions = vi.fn().mockResolvedValue([]);
const mockCreateQuestion = vi.fn().mockResolvedValue({ id: "q1" });
const mockAddOption = vi.fn().mockResolvedValue(undefined);

vi.mock("@/services/questions", () => ({
  listQuestions: (quizId: string) => mockListQuestions(quizId),
  createQuestion: (
    payload: { quiz_id: string; type: string; content: string; points: number; order_no: number },
    options?: Array<{ question_id: string; content: string; is_correct: boolean; order_no: number }>
  ) => mockCreateQuestion(payload, options),
  addOption: (opt: { question_id: string; content: string; is_correct: boolean; order_no: number }) => mockAddOption(opt),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  deleteOption: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: { id: "quiz-1", name: "اختبار تجريبي" }, error: null }) }) }),
    }),
  },
}));

const renderWithProviders = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/quizzes/quiz-1/edit"]}>
        <Routes>
          <Route path="/quizzes/:id/edit" element={<QuizEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("QuizEditor add question", () => {
  it("adds a question", async () => {
    renderWithProviders();
    await screen.findByText(/تحرير الاختبار/i);
    const textarea = await screen.findByLabelText(/نص السؤال/i);
    fireEvent.change(textarea, { target: { value: "ما قيمة $2+2$؟" } });
    const addBtn = await screen.findByRole("button", { name: /إضافة السؤال/i });
    fireEvent.click(addBtn);
    expect(mockCreateQuestion).toHaveBeenCalled();
    expect(mockAddOption).not.toHaveBeenCalled();
  });
});
