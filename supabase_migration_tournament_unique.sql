-- Fix: Allow multiple Turnier per date (different tournament_info).
-- Run this in Supabase SQL Editor if you get:
--   duplicate key value violates unique constraint "attendance_date_activity_type_key"
--
-- This drops the old unique (date, activity_type) and adds
-- unique (date, activity_type, tournament_info) so you can have
-- e.g. 2025-09-01 Turnier "Tuggen 2" and 2025-09-01 Turnier "Hallenturnier".

-- 1) Drop old constraint (one record per date + activity_type only)
ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_date_activity_type_key;

-- 2) New uniqueness: one record per (date, activity_type, tournament_info).
--    NULL and empty string treated the same so we only allow one "Turnier" with no info per date.
CREATE UNIQUE INDEX IF NOT EXISTS attendance_date_activity_tournament_key
  ON public.attendance (date, activity_type, COALESCE(NULLIF(trim(tournament_info), ''), ''));
