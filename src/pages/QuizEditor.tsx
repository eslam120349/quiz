import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { listQuestions, createQuestion, updateQuestion, deleteQuestion } from "@/services/questions";
import { MathText } from "@/components/MathText";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type QType = "multiple_choice" | "true_false" | "essay";

const QuizEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [quizTitle, setQuizTitle] = useState<string>("");
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [items, setItems] = useState<Awaited<ReturnType<typeof listQuestions>>>([]);

  const fetchAll = async () => {
    if (!id) return;
    try {
      setLoadingQuiz(true);
      const { data: quiz, error } = await supabase.from("quizzes").select("*").eq("id", id).single();
      if (error) throw new Error(error.message);
      setQuizTitle(quiz.name);
      const rows = await listQuestions(id);
      setItems(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "تعذر تحميل بيانات الاختبار", description: msg, variant: "destructive" });
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (user && id) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const [newQType, setNewQType] = useState<QType>("multiple_choice");
  const [newQText, setNewQText] = useState("");
  const [newQPoints, setNewQPoints] = useState(1);
  const [mcOptions, setMcOptions] = useState<{ id: string; content: string; is_correct: boolean }[]>([
    { id: crypto.randomUUID(), content: "", is_correct: false },
    { id: crypto.randomUUID(), content: "", is_correct: false },
  ]);
  const canSave = useMemo(() => newQText.trim().length >= 3 && newQPoints > 0, [newQText, newQPoints]);

  const addQuestion = async () => {
    if (!id) return;
    try {
      const order = items.length ? Math.max(...items.map((i) => i.questions.order_no)) + 1 : 1;
      const q = await createQuestion(
        { quiz_id: id, type: newQType, content: newQText.trim(), points: newQPoints, order_no: order },
        newQType === "multiple_choice" ? mcOptions.map((o, idx) => ({ question_id: "", content: o.content.trim(), is_correct: o.is_correct, order_no: idx + 1 })) : undefined,
      );
      setNewQText("");
      setNewQPoints(1);
      setMcOptions([
        { id: crypto.randomUUID(), content: "", is_correct: false },
        { id: crypto.randomUUID(), content: "", is_correct: false },
      ]);
      await fetchAll();
      toast({ title: "تم إضافة السؤال" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "تعذر إضافة السؤال", description: msg, variant: "destructive" });
    }
  };

  const removeQuestion = async (qid: string) => {
    try {
      await deleteQuestion(qid);
      await fetchAll();
      toast({ title: "تم حذف السؤال" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "تعذر حذف السؤال", description: msg, variant: "destructive" });
    }
  };

  if (loading || loadingQuiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-display text-xl font-bold text-foreground">تحرير الاختبار: {quizTitle}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/quizzes/${id}/results`)}>النتائج</Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>رجوع</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">إضافة سؤال جديد</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm mb-1 block" htmlFor="q-type">نوع السؤال</label>
                  <Select value={newQType} onValueChange={(v) => setNewQType(v as QType)}>
                    <SelectTrigger id="q-type">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                      <SelectItem value="true_false">صح / خطأ</SelectItem>
                      <SelectItem value="essay">مقالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm mb-1 block" htmlFor="q-points">الدرجة</label>
                  <Input id="q-points" type="number" min={0} value={newQPoints} onChange={(e) => setNewQPoints(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-sm mb-1 block" htmlFor="q-text">نص السؤال (يدعم LaTeX عبر $...$)</label>
                <Textarea id="q-text" rows={5} value={newQText} onChange={(e) => setNewQText(e.target.value)} />
                <div className="mt-3 rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-1">المعاينة:</p>
                  <MathText>{newQText || "—"}</MathText>
                </div>
              </div>
              {newQType === "multiple_choice" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">الخيارات</span>
                    <Button type="button" variant="outline" onClick={() => setMcOptions((arr) => [...arr, { id: crypto.randomUUID(), content: "", is_correct: false }])}>إضافة خيار</Button>
                  </div>
                  {mcOptions.map((o, idx) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <Checkbox checked={o.is_correct} onCheckedChange={(v) => setMcOptions((arr) => arr.map((x) => (x.id === o.id ? { ...x, is_correct: !!v } : x)))} />
                      <Input
                        placeholder={`الخيار ${idx + 1}`}
                        value={o.content}
                        onChange={(e) => setMcOptions((arr) => arr.map((x) => (x.id === o.id ? { ...x, content: e.target.value } : x)))}
                      />
                      <Button variant="ghost" onClick={() => setMcOptions((arr) => arr.filter((x) => x.id !== o.id))}>حذف</Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button disabled={!canSave} onClick={addQuestion} onTouchEnd={addQuestion}>إضافة السؤال</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">الأسئلة الحالية</h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد أسئلة بعد</p>
              ) : (
                items.map((row) => (
                  <div key={row.questions.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">نوع: {row.questions.type} • درجة: {row.questions.points}</div>
                        <MathText className="prose max-w-none">{row.questions.content}</MathText>
                        {row.questions.type === "multiple_choice" && (
                          <ul className="mt-2 list-disc pl-5">
                            {row.options.map((op) => (
                              <li key={op.id} className={op.is_correct ? "text-success" : ""}>
                                <MathText>{op.content}</MathText>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/quizzes/${id}/edit?q=${row.questions.id}`)}>تعديل</Button>
                        <Button size="sm" variant="destructive" onClick={() => removeQuestion(row.questions.id)}>حذف</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuizEditor;
