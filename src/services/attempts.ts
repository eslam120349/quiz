import { supabase } from "@/integrations/supabase/client";

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  duration_seconds: number | null;
}

export interface AttemptResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_ids: string[] | null;
  true_false_answer: boolean | null;
  text_answer: string | null;
  score: number | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export async function startAttempt(quizId: string, studentId: string) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: studentId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as QuizAttempt;
}

export async function submitAttempt(attemptId: string, totalScore: number, durationSec: number) {
  const { error } = await supabase
    .from("quiz_attempts")
    .update({ submitted_at: new Date().toISOString(), total_score: totalScore, duration_seconds: durationSec })
    .eq("id", attemptId);
  if (error) throw new Error(error.message);
}

export async function saveResponse(resp: Omit<AttemptResponse, "id" | "created_at">) {
  const { error } = await supabase.from("attempt_responses").insert(resp);
  if (error) throw new Error(error.message);
}

export async function listAttemptsForQuiz(quizId: string) {
  const { data, error } = await supabase.from("quiz_attempts").select("*").eq("quiz_id", quizId).order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as QuizAttempt[];
}

export async function listResponsesForAttempt(attemptId: string) {
  const { data, error } = await supabase.from("attempt_responses").select("*").eq("attempt_id", attemptId);
  if (error) throw new Error(error.message);
  return data as AttemptResponse[];
}
