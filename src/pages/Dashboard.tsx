import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Plus, FileText, Users, BarChart3, MoreHorizontal,
  Copy, Trash2, ExternalLink, Zap, LogOut,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { listQuizzes } from "@/services/quizzes";
import { useToast } from "@/hooks/use-toast";

const stats = [
  { label: "إجمالي الاختبارات", value: "0", icon: FileText, color: "text-primary" },
  { label: "نشط الآن", value: "0", icon: BarChart3, color: "text-success" },
  { label: "إجمالي الإجابات", value: "0", icon: Users, color: "text-accent" },
];

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: quizzes = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["quizzes", user?.id],
    queryFn: () => listQuizzes(user!.id),
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "معلم";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">QuizMaster</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">مرحباً، {displayName} 👋</h1>
          <p className="mt-1 text-muted-foreground">نظرة عامة على اختباراتك.</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="shadow-soft">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-foreground">اختباراتك</h2>
          <Button onClick={() => navigate("/quizzes/new")} onTouchEnd={() => navigate("/quizzes/new")}>
            <Plus className="mr-2 h-4 w-4" /> اختبار جديد
          </Button>
        </div>

        {isLoading ? (
          <Card className="shadow-soft p-12 text-center">
            <div className="animate-pulse space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
              <div className="mx-auto h-4 w-40 rounded bg-muted" />
              <div className="mx-auto h-4 w-24 rounded bg-muted" />
            </div>
          </Card>
        ) : isError ? (
          <Card className="shadow-soft p-12 text-center">
            <p className="text-destructive">تعذر تحميل الاختبارات: {(error as Error).message}</p>
            <Button className="mt-4" onClick={() => refetch()}>إعادة المحاولة</Button>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card className="shadow-soft p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">لم تنشئ أي اختبارات بعد</p>
            <Button className="mt-4" onClick={() => navigate("/quizzes/new")} onTouchEnd={() => navigate("/quizzes/new")}>
              <Plus className="mr-2 h-4 w-4" /> إنشاء أول اختبار
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <Card key={q.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-card-foreground">{q.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{q.description || "بدون وصف"}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">المدة: {q.durationMinutes} دقيقة</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="خيارات">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            const link = `${window.location.origin}/quiz/join?quiz=${q.id}`;
                            navigator.clipboard.writeText(link).then(
                              () => toast({ title: "تم نسخ رابط الحضور", description: "أرسل هذا الرابط للطلاب للانضمام إلى الامتحان." }),
                              () => toast({ title: "تعذر نسخ الرابط", variant: "destructive" }),
                            );
                          }}
                        >
                          نسخ رابط الحضور
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            navigate(`/quizzes/${q.id}/edit`);
                          }}
                        >
                          فتح
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
