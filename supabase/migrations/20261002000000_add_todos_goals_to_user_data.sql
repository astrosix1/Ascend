-- Add the two data types that previously only lived in the browser/device:
--   todos  (Quick Tasks)
--   goals  (Goals screen)
-- Stored as JSON strings like every other user_data column. Idempotent.

alter table public.user_data
  add column if not exists todos text,
  add column if not exists goals text,
  add column if not exists last_todos_sync timestamptz,
  add column if not exists last_goals_sync timestamptz;

-- Make PostgREST pick up the new columns immediately.
notify pgrst, 'reload schema';
