
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  school TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Quizzes: schema + RLS + policies
-- ============================================

-- Enum for question types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_question_type') THEN
    CREATE TYPE public.quiz_question_type AS ENUM ('multiple_choice', 'essay', 'mixed');
  END IF;
END$$;

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  question_type public.quiz_question_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_owner_id ON public.quizzes(owner_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own quizzes"
ON public.quizzes FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own quizzes"
ON public.quizzes FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own quizzes"
ON public.quizzes FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own quizzes"
ON public.quizzes FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ============================================
-- Questions, Options, Attempts, Responses
-- ============================================

-- Enum for question types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false', 'essay');
  END IF;
END$$;

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type public.question_type NOT NULL,
  content TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
  order_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id, order_no);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies: only quiz owner can manage questions
CREATE POLICY "Owner can SELECT questions"
ON public.questions FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()));

CREATE POLICY "Owner can INSERT questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.owner_id = auth.uid()));

CREATE POLICY "Owner can UPDATE questions"
ON public.questions FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()));

CREATE POLICY "Owner can DELETE questions"
ON public.questions FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()));

-- Question Options
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_no INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id, order_no);
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage options - SELECT"
ON public.question_options FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_options.question_id AND q.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can manage options - INSERT"
ON public.question_options FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND q.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can manage options - UPDATE"
ON public.question_options FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_options.question_id AND q.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_options.question_id AND q.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can manage options - DELETE"
ON public.question_options FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_options.question_id AND q.owner_id = auth.uid()
  )
);

-- Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.quiz_attempts(student_id);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Attempts policies: student owns their attempt; quiz owner can view attempts for their quiz
CREATE POLICY "Student can manage own attempts - SELECT"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.owner_id = auth.uid()));

CREATE POLICY "Student can INSERT own attempt"
ON public.quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Student can UPDATE own attempt"
ON public.quiz_attempts FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Responses
CREATE TABLE IF NOT EXISTS public.attempt_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_ids UUID[],
  true_false_answer BOOLEAN,
  text_answer TEXT,
  score NUMERIC DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_attempt ON public.attempt_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON public.attempt_responses(question_id);
ALTER TABLE public.attempt_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student can manage own responses - SELECT"
ON public.attempt_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    WHERE a.id = attempt_responses.attempt_id AND a.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.quiz_attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.id = attempt_responses.attempt_id AND q.owner_id = auth.uid()
  )
);

CREATE POLICY "Student can INSERT own responses"
ON public.attempt_responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    WHERE a.id = attempt_id AND a.student_id = auth.uid()
  )
);

CREATE POLICY "Student can UPDATE own responses"
ON public.attempt_responses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    WHERE a.id = attempt_responses.attempt_id AND a.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts a
    WHERE a.id = attempt_responses.attempt_id AND a.student_id = auth.uid()
  )
);
