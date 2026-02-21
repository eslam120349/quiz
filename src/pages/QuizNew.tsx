import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createQuiz, QuestionType } from "@/services/quizzes";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  name: z.string().min(3, "الاسم مطلوب (٣ أحرف على الأقل)"),
  description: z.string().max(500, "الوصف طويل جداً").optional().or(z.literal("")),
  durationMinutes: z
    .preprocess((v) => Number(v), z.number().int("يجب أن يكون عدداً صحيحاً").positive("المدة يجب أن تكون أكبر من 0")),
  questionType: z.enum(["multiple_choice", "essay", "mixed"], {
    required_error: "نوع الأسئلة مطلوب",
  }),
});

type FormValues = z.infer<typeof schema>;

const QuizNew = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", durationMinutes: 30, questionType: "multiple_choice" },
    mode: "onChange",
  });

  if (loading) {
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

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      await createQuiz({
        name: values.name.trim(),
        description: values.description?.trim() || "",
        durationMinutes: Number(values.durationMinutes),
        questionType: values.questionType as QuestionType,
        owner_id: user.id,
      });
      toast({ title: "تم إنشاء الاختبار بنجاح", description: "يمكنك إدارة أسئلته الآن." });
      navigate("/dashboard");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
      toast({ title: "فشل إنشاء الاختبار", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-display text-xl font-bold text-foreground">إنشاء اختبار جديد</h1>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 shadow-soft">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(onSubmit)}
              onTouchEnd={() => form.handleSubmit(onSubmit)()}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الاختبار</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: اختبار الوحدة الأولى" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="وصف موجز لمحتوى الاختبار" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدة بالدقائق</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الأسئلة</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الأسئلة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">اختيار من متعدد</SelectItem>
                            <SelectItem value="essay">مقالي</SelectItem>
                            <SelectItem value="mixed">مختلط</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={submitting} onClick={form.handleSubmit(onSubmit)} onTouchEnd={form.handleSubmit(onSubmit)}>
                  {submitting ? "جارٍ الحفظ..." : "حفظ الاختبار"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default QuizNew;
