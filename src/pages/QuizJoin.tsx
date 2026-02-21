import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MathText } from "@/components/MathText";
import { listQuestions } from "@/services/questions";
import { startAttempt, saveResponse, submitAttempt } from "@/services/attempts";
import { supabase } from "@/integrations/supabase/client";

const QuizJoin = () => {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quiz") || "";
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [quizTitle, setQuizTitle] = useState<string>("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [started, setStarted] = useState(false);

  const [items, setItems] = useState<Awaited<ReturnType<typeof listQuestions>>>([]);
  const [attemptId, setAttemptId] = useState<string>("");
  const [startAtMs, setStartAtMs] = useState<number>(0);

  const canStart = useMemo(() => studentName.trim().length >= 2 && !!quizId, [studentName, quizId]);

  useEffect(() => {
    const run = async () => {
      if (!quizId) {
        toast({ title: "رابط غير صالح", description: "معرف الاختبار غير موجود في الرابط.", variant: "destructive" });
        setLoadingPage(false);
        return;
      }
      try {
        setLoadingPage(true);
        const { data: quiz, error } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
        if (error) throw new Error(error.message);
        setQuizTitle(quiz.name);
        const rows = await listQuestions(quizId);
        setItems(rows);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        toast({ title: "تعذر تحميل بيانات الاختبار", description: msg, variant: "destructive" });
      } finally {
        setLoadingPage(false);
      }
    };
    run();
  }, [quizId, toast]);

  const [answers, setAnswers] = useState<Record<string, { selected_option_ids?: string[]; true_false_answer?: boolean; text_answer?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    totalScore: number;
    totalPoints: number;
    percent: number;
    grade: string;
    byQuestion: Array<{
      id: string;
      order_no: number;
      type: string;
      points: number;
      isCorrect: boolean | null;
      correctOptionIds: string[];
      studentSelectionIds: string[];
    }>;
  } | null>(null);
  const [autoCloseIn, setAutoCloseIn] = useState<number>(45);

  useEffect(() => {
    const key = `quizflow:completed:${quizId}:${studentName.trim().toLowerCase()}`;
    const exists = localStorage.getItem(key);
    if (exists) {
      toast({ title: "لا يمكنك دخول الاختبار مرة أخرى", description: "تم إرسال إجاباتك سابقاً.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [quizId, studentName, navigate, toast]);

  const startExam = async () => {
    if (!canStart) return;
    try {
      if (user) {
        const attempt = await startAttempt(quizId, user.id);
        setAttemptId(attempt.id);
      } else {
        const gid = crypto.randomUUID();
        setAttemptId(gid);
      }
      setStartAtMs(Date.now());
      setStarted(true);
      toast({ title: "بدأ الامتحان", description: "بالتوفيق!" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "تعذر بدء الامتحان", description: msg, variant: "destructive" });
    }
  };

  const submitExam = async () => {
    if (!started || !attemptId) return;
    try {
      if (user) {
        for (const q of items) {
          const a = answers[q.questions.id];
          if (!a) continue;
          await saveResponse({
            attempt_id: attemptId,
            question_id: q.questions.id,
            selected_option_ids: a.selected_option_ids ?? null,
            true_false_answer: typeof a.true_false_answer === "boolean" ? a.true_false_answer : null,
            text_answer: a.text_answer ?? null,
            score: null,
            time_spent_seconds: null,
          });
        }
      } else {
        const key = `quizflow:responses:${quizId}`;
        const prevRaw = localStorage.getItem(key);
        const prev = prevRaw ? JSON.parse(prevRaw) : [];
        const duration_seconds = startAtMs ? Math.max(0, Math.round((Date.now() - startAtMs) / 1000)) : 0;
        prev.unshift({
          attempt_id: attemptId,
          student_name: studentName.trim(),
          at: new Date().toISOString(),
          answers,
          duration_seconds,
        });
        localStorage.setItem(key, JSON.stringify(prev));
      }
      const byQuestion = items.map((row) => {
        const sel = answers[row.questions.id]?.selected_option_ids ?? [];
        const correctIds = row.questions.type === "multiple_choice" ? row.options.filter((o) => o.is_correct).map((o) => o.id) : [];
        const isEq =
          row.questions.type === "multiple_choice"
            ? sel.length === correctIds.length && sel.every((x) => correctIds.includes(x))
            : null;
        const scorePart = isEq ? row.questions.points : 0;
        return {
          id: row.questions.id,
          order_no: row.questions.order_no,
          type: row.questions.type,
          points: row.questions.points,
          isCorrect: isEq,
          correctOptionIds: correctIds,
          studentSelectionIds: sel,
          scorePart,
        };
      });
      const totalPoints = items.reduce((sum, r) => sum + r.questions.points, 0);
      const totalScore = byQuestion.reduce((sum, r) => sum + r.scorePart, 0);
      const percent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
      const grade = percent >= 90 ? "ممتاز" : percent >= 80 ? "جيد جداً" : percent >= 70 ? "جيد" : percent >= 60 ? "مقبول" : "ضعيف";
      setResult({
        totalScore,
        totalPoints,
        percent,
        grade,
        byQuestion: byQuestion.map((r) => ({
          id: r.id,
          order_no: r.order_no,
          type: r.type,
          points: r.points,
          isCorrect: r.isCorrect,
          correctOptionIds: r.correctOptionIds,
          studentSelectionIds: r.studentSelectionIds,
        })),
      });
      setSubmitted(true);
      if (user) {
        const durationSec = startAtMs ? Math.max(0, Math.round((Date.now() - startAtMs) / 1000)) : 0;
        await submitAttempt(attemptId, totalScore, durationSec);
      }
      const completedKey = `quizflow:completed:${quizId}:${studentName.trim().toLowerCase()}`;
      localStorage.setItem(completedKey, "1");
      toast({ title: "تم الإرسال", description: "تم إرسال إجاباتك وعرض النتيجة.", duration: 4000 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "تعذر الإرسال", description: msg, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setAutoCloseIn((s) => {
        if (s <= 1) {
          clearInterval(interval);
          navigate("/", { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, navigate]);

  if (loadingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-display text-xl font-bold text-foreground">الامتحان: {quizTitle}</h1>
          <Button variant="ghost" onClick={() => navigate(-1)}>رجوع</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {!started ? (
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm mb-1 block" htmlFor="student-name">اسم الطالب (إجباري)</label>
                <Input id="student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="اكتب اسمك هنا" />
              </div>
              <div className="flex justify-end">
                <Button disabled={!canStart} onClick={startExam} onTouchEnd={startExam}>ابدأ الامتحان</Button>
              </div>
            </CardContent>
          </Card>
        ) : !submitted ? (
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-6">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد أسئلة لهذا الامتحان.</p>
              ) : (
                items.map((row, idx) => (
                  <div key={row.questions.id} className="rounded-md border p-4">
                    <div className="text-sm text-muted-foreground mb-2">سؤال {idx + 1} • درجة: {row.questions.points}</div>
                    <MathText className="prose max-w-none">{row.questions.content}</MathText>
                    {row.questions.type === "multiple_choice" && (
                      <ul className="mt-3 space-y-2">
                        {row.options.map((op) => {
                          const sel = answers[row.questions.id]?.selected_option_ids ?? [];
                          const checked = sel.includes(op.id);
                          return (
                            <li key={op.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setAnswers((prev) => {
                                    const current = prev[row.questions.id]?.selected_option_ids ?? [];
                                    const next = e.target.checked ? Array.from(new Set([...current, op.id])) : current.filter((x) => x !== op.id);
                                    return { ...prev, [row.questions.id]: { ...prev[row.questions.id], selected_option_ids: next } };
                                  });
                                }}
                              />
                              <MathText>{op.content}</MathText>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {row.questions.type === "true_false" && (
                      <div className="mt-3 flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`tf-${row.questions.id}`}
                            checked={answers[row.questions.id]?.true_false_answer === true}
                            onChange={() => setAnswers((prev) => ({ ...prev, [row.questions.id]: { ...prev[row.questions.id], true_false_answer: true } }))}
                          />
                          <span>صح</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`tf-${row.questions.id}`}
                            checked={answers[row.questions.id]?.true_false_answer === false}
                            onChange={() => setAnswers((prev) => ({ ...prev, [row.questions.id]: { ...prev[row.questions.id], true_false_answer: false } }))}
                          />
                          <span>خطأ</span>
                        </label>
                      </div>
                    )}
                    {row.questions.type === "essay" && (
                      <div className="mt-3">
                        <textarea
                          className="w-full rounded-md border p-2"
                          rows={4}
                          value={answers[row.questions.id]?.text_answer ?? ""}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [row.questions.id]: { ...prev[row.questions.id], text_answer: e.target.value } }))}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div className="flex justify-end">
                <Button onClick={submitExam} onTouchEnd={submitExam}>إرسال الإجابات</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">نتيجة نهائية</div>
                  <div className="text-2xl font-bold">{result?.totalScore} / {result?.totalPoints} نقطة</div>
                  <div className="text-sm">النسبة: {result?.percent}% • التقدير: {result?.grade}</div>
                </div>
                <div className="text-xs text-muted-foreground">سيتم الإغلاق التلقائي خلال {autoCloseIn} ثانية</div>
              </div>
              {items.map((row) => {
                const rq = result?.byQuestion.find((x) => x.id === row.questions.id);
                const statusClass = rq?.isCorrect ? "text-success" : rq?.isCorrect === false ? "text-destructive" : "text-muted-foreground";
                return (
                  <div key={row.questions.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">درجة: {row.questions.points}</div>
                      <div className={`text-sm font-semibold ${statusClass}`}>{rq?.isCorrect ? "إجابة صحيحة" : rq?.isCorrect === false ? "إجابة خاطئة" : "غير مُقيّم"}</div>
                    </div>
                    <MathText className="prose max-w-none">{row.questions.content}</MathText>
                    {row.questions.type === "multiple_choice" && (
                      <ul className="mt-3 space-y-1">
                        {row.options.map((op) => {
                          const isCorrect = op.is_correct;
                          const chosen = rq?.studentSelectionIds.includes(op.id) ?? false;
                          const cls = isCorrect ? "text-success" : chosen ? "text-destructive" : "";
                          return (
                            <li key={op.id} className={cls}>
                              <MathText>{op.content}</MathText>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {row.questions.type !== "multiple_choice" && (
                      <div className="mt-2 text-xs text-muted-foreground">لا توجد إجابة صحيحة مسجلة لهذا النوع.</div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate("/", { replace: true })}>إغلاق الصفحة</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default QuizJoin;
