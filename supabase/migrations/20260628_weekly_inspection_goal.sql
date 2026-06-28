-- Meta semanal de inspeções configurável por usuário
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_inspection_goal integer NOT NULL DEFAULT 3
  CHECK (weekly_inspection_goal BETWEEN 1 AND 20);
