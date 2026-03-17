
-- Add UNIQUE constraint to prevent duplicate sessions per user per day
ALTER TABLE public.daily_sessions ADD CONSTRAINT daily_sessions_user_date_unique UNIQUE (user_id, date);
