import { supabase } from "@/integrations/supabase/client";

export type QuestionType = "multiple_choice" | "essay" | "mixed";

export interface Quiz {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  questionType: QuestionType;
  owner_id: string;
  created_at: string;
}

const QUIZZES_STORAGE_KEY = "quizflow:quizzes";

const shouldUseLocalFallback = () => {
  return !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
};

const loadLocal = (): Quiz[] => {
  const raw = localStorage.getItem(QUIZZES_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Quiz[]) : [];
};

const saveLocal = (items: Quiz[]) => {
  localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(items));
};

export async function createQuiz(input: Omit<Quiz, "id" | "created_at">): Promise<Quiz> {
  if (shouldUseLocalFallback()) {
    const now = new Date().toISOString();
    const quiz: Quiz = { ...input, id: crypto.randomUUID(), created_at: now };
    const items = loadLocal();
    items.unshift(quiz);
    saveLocal(items);
    return quiz;
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      name: input.name,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes,
      question_type: input.questionType,
      owner_id: input.owner_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    durationMinutes: data.duration_minutes,
    questionType: data.question_type,
    owner_id: data.owner_id,
    created_at: data.created_at,
  } as Quiz;
}

export async function listQuizzes(ownerId: string): Promise<Quiz[]> {
  if (shouldUseLocalFallback()) {
    return loadLocal().filter((q) => q.owner_id === ownerId);
  }
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  type DbQuizRow = {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    question_type: QuestionType;
    owner_id: string;
    created_at: string;
  };
  return (data as DbQuizRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    questionType: row.question_type,
    owner_id: row.owner_id,
    created_at: row.created_at,
  })) as Quiz[];
}
