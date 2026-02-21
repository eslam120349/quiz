import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAttemptsForQuiz } from "@/services/attempts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const QuizResults = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Awaited<ReturnType<typeof listAttemptsForQuiz>>>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoadingPage(true);
        const rows = await listAttemptsForQuiz(id);
        setAttempts(rows);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        toast({ title: "تعذر تحميل النتائج", description: msg, variant: "destructive" });
      } finally {
        setLoadingPage(false);
      }
    };
    if (user && id) run();
  }, [user, id, toast]);

  if (loading || loadingPage) {
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
          <h1 className="font-display text-xl font-bold text-foreground">نتائج الاختبار</h1>
          <Button variant="ghost" onClick={() => navigate(-1)}>رجوع</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد محاولات بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">المعرف</th>
                      <th className="p-2">بدء</th>
                      <th className="p-2">إنهاء</th>
                      <th className="p-2">المدة (ث)</th>
                      <th className="p-2">الدرجة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="p-2">{a.student_id}</td>
                        <td className="p-2">{new Date(a.started_at).toLocaleString()}</td>
                        <td className="p-2">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}</td>
                        <td className="p-2">{a.duration_seconds ?? 0}</td>
                        <td className="p-2">{a.total_score ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default QuizResults;
