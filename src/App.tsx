import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import QuizNew from "./pages/QuizNew";
import QuizEditor from "./pages/QuizEditor";
import QuizResults from "./pages/QuizResults";
import QuizJoin from "./pages/QuizJoin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/register" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quizzes/new" element={<QuizNew />} />
          <Route path="/quizzes/:id/edit" element={<QuizEditor />} />
          <Route path="/quizzes/:id/results" element={<QuizResults />} />
          <Route path="/quiz/join" element={<QuizJoin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
