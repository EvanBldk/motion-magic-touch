
ALTER TABLE public.force_evaluations
  ADD COLUMN first_name text,
  ADD COLUMN age integer,
  ADD COLUMN experience text,
  ADD COLUMN days_per_week integer NOT NULL DEFAULT 3,
  ADD COLUMN session_duration text,
  ADD COLUMN raw_answers jsonb NOT NULL DEFAULT '{}'::jsonb;
