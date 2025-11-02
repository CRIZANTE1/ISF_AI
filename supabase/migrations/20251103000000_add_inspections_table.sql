/*
# [Operation] Create Inspections Table
This script creates the `inspections` table to store all inspection records. It also defines a custom type for inspection statuses.

## Query Description:
This is a structural change and is safe to run. It adds a new table and a new type to the database, which are necessary for the new inspection features. It does not affect any existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the table and type)

## Structure Details:
- Tables affected: `inspections` (new)
- Types affected: `app_inspection_status` (new)
- Columns added:
  - `inspections.id` (PK)
  - `inspections.user_id` (FK to auth.users)
  - `inspections.equipment_id` (FK to public.equipment)
  - `inspections.status`
  - `inspections.inspection_date`
  - `inspections.observacoes`
  - `inspections.created_at`

## Security Implications:
- RLS Status: Enabled on the new `inspections` table.
- Policy Changes: Yes, new policies are created for the `inspections` table to ensure users can only access their own inspection data.
- Auth Requirements: Users must be authenticated to interact with this table.

## Performance Impact:
- Indexes: Indexes are added on `user_id` and `equipment_id` for efficient querying.
- Triggers: None.
- Estimated Impact: Low. This is a new table and will not impact performance of existing queries.
*/

-- 1. Create a custom type for inspection status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_inspection_status') THEN
        CREATE TYPE public.app_inspection_status AS ENUM ('aprovado', 'reprovado', 'pendente');
    END IF;
END
$$;

-- 2. Create the inspections table
CREATE TABLE IF NOT EXISTS public.inspections (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    equipment_id uuid NOT NULL,
    status public.app_inspection_status NOT NULL,
    inspection_date timestamp with time zone NOT NULL DEFAULT now(),
    observacoes text,
    CONSTRAINT inspections_pkey PRIMARY KEY (id),
    CONSTRAINT inspections_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE,
    CONSTRAINT inspections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Add comments to the new table and columns
COMMENT ON TABLE public.inspections IS 'Stores records of equipment inspections.';
COMMENT ON COLUMN public.inspections.equipment_id IS 'FK to the equipment that was inspected.';
COMMENT ON COLUMN public.inspections.status IS 'The result of the inspection.';
COMMENT ON COLUMN public.inspections.inspection_date IS 'When the inspection was performed.';
COMMENT ON COLUMN public.inspections.observacoes IS 'General notes or observations from the inspector.';

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS inspections_user_id_idx ON public.inspections USING btree (user_id);
CREATE INDEX IF NOT EXISTS inspections_equipment_id_idx ON public.inspections USING btree (equipment_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DROP POLICY IF EXISTS "Users can view their own inspections." ON public.inspections;
CREATE POLICY "Users can view their own inspections."
    ON public.inspections FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own inspections." ON public.inspections;
CREATE POLICY "Users can insert their own inspections."
    ON public.inspections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own inspections." ON public.inspections;
CREATE POLICY "Users can update their own inspections."
    ON public.inspections FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own inspections." ON public.inspections;
CREATE POLICY "Users can delete their own inspections."
    ON public.inspections FOR DELETE
    USING (auth.uid() = user_id);
