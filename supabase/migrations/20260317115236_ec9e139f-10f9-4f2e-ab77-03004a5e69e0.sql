-- 1. ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'athlete');

-- 2. TABLES

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.force_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  pull_ups int NOT NULL DEFAULT 0,
  dips int NOT NULL DEFAULT 0,
  push_ups int NOT NULL DEFAULT 0,
  l_sit int NOT NULL DEFAULT 0,
  hollow int NOT NULL DEFAULT 0,
  skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.force_evaluations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mobility_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wrists_score int NOT NULL DEFAULT 0,
  shoulders_score int NOT NULL DEFAULT 0,
  thoracic_score int NOT NULL DEFAULT 0,
  posterior_score int NOT NULL DEFAULT 0,
  hips_score int NOT NULL DEFAULT 0,
  ankles_score int NOT NULL DEFAULT 0,
  pain_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mobility_evaluations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.weekly_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  ai_generated jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.daily_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.weekly_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  feedback_reps jsonb NOT NULL DEFAULT '{}'::jsonb,
  pain_reported text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;

-- 3. SECURITY DEFINER FUNCTION

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS POLICIES

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can select own force evals" ON public.force_evaluations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own force evals" ON public.force_evaluations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own force evals" ON public.force_evaluations FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all force evals" ON public.force_evaluations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can select own mobility evals" ON public.mobility_evaluations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own mobility evals" ON public.mobility_evaluations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own mobility evals" ON public.mobility_evaluations FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all mobility evals" ON public.mobility_evaluations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can select own programs" ON public.weekly_programs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own programs" ON public.weekly_programs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own programs" ON public.weekly_programs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all programs" ON public.weekly_programs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can select own sessions" ON public.daily_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sessions" ON public.daily_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON public.daily_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all sessions" ON public.daily_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'athlete');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();