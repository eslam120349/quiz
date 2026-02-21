import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type QuestionType = Database["public"]["Enums"]["question_type"];

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  content: string;
  points: number;
  order_no: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  order_no: number;
}

export async function listQuestions(quizId: string): Promise<{ questions: Question; options: QuestionOption[] }[]> {
  const { data: qs, error } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("order_no", { ascending: true });
  if (error) throw new Error(error.message);
  const qids = (qs ?? []).map((q) => q.id);
  if (qids.length === 0) return [];
  const { data: opts, error: e2 } = await supabase.from("question_options").select("*").in("question_id", qids).order("order_no", { ascending: true });
  if (e2) throw new Error(e2.message);
  const grouped = (qs as Question[]).map((q) => ({
    questions: q,
    options: (opts as QuestionOption[]).filter((o) => o.question_id === q.id),
  }));
  return grouped;
}

export async function createQuestion(payload: Omit<Question, "id" | "created_at">, options?: Omit<QuestionOption, "id">[]) {
  const { data, error } = await supabase
    .from("questions")
    .insert({
      quiz_id: payload.quiz_id,
      type: payload.type,
      content: payload.content,
      points: payload.points,
      order_no: payload.order_no,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const question = data as Question;
  if (options?.length) {
    const insertOpts = options
      .map((o) => ({ ...o, question_id: question.id, content: o.content.trim() }))
      .filter((o) => o.content.length > 0);
    const { error: e3 } = await supabase.from("question_options").insert(insertOpts);
    if (e3) throw new Error(e3.message);
  }
  return question;
}

export async function updateQuestion(id: string, patch: Partial<Pick<Question, "type" | "content" | "points" | "order_no">>) {
  const { error } = await supabase.from("questions").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addOption(option: Omit<QuestionOption, "id">) {
  const { error } = await supabase.from("question_options").insert(option);
  if (error) throw new Error(error.message);
}

export async function updateOption(id: string, patch: Partial<Pick<QuestionOption, "content" | "is_correct" | "order_no">>) {
  const { error } = await supabase.from("question_options").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteOption(id: string) {
  const { error } = await supabase.from("question_options").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
