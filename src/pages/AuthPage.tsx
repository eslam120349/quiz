import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Zap, Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const location = useLocation();
  const defaultTab = location.pathname.includes("register") ? "register" : "login";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { name: regName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "تم إنشاء الحساب!",
        description: "تحقق من بريدك الإلكتروني لتأكيد الحساب.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">QuizMaster</span>
        </Link>

        <Card className="shadow-medium">
          <Tabs defaultValue={defaultTab}>
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <CardHeader className="pt-2">
                <CardTitle className="font-display">مرحباً بعودتك</CardTitle>
                <CardDescription>سجل الدخول إلى حسابك</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@school.edu"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "جاري التحميل..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader className="pt-2">
                <CardTitle className="font-display">إنشاء حساب جديد</CardTitle>
                <CardDescription>ابدأ بإنشاء اختباراتك في دقائق</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        placeholder="أحمد محمد"
                        className="pl-10"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@school.edu"
                        className="pl-10"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "جاري التحميل..." : "إنشاء حساب"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          طالب؟ <Link to="/quiz/join" className="text-primary hover:underline">انضم لاختبار من هنا</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
