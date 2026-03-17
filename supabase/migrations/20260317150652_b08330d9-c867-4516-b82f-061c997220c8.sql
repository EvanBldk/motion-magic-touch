
ALTER TABLE public.mobility_evaluations
  ADD COLUMN raw_scores jsonb NOT NULL DEFAULT '{}'::jsonb;
