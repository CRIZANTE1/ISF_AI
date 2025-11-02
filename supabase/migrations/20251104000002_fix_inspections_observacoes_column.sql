/*
# [Operation] Fix Inspections Column Name
This script ensures the inspections table has the correct column name for observations.
The column should match what the TypeScript types expect (notes).

## Query Description:
This script checks if the column is named 'observacoes' and renames it to 'notes' if needed,
or adds 'notes' as an alias. This ensures compatibility with the TypeScript client.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: `inspections`
- Column rename: `observacoes` → `notes` (if needed)

## Security Implications:
- RLS Status: No changes to RLS policies
- Policy Changes: None
- Auth Requirements: Requires database admin privileges

## Performance Impact:
- Indexes: No new indexes
- Triggers: None
- Estimated Impact: Low
*/

-- Check if table exists first, then fix column name
DO $$
BEGIN
    -- First, check if the table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inspections'
    ) THEN
        -- Check if 'observacoes' column exists and rename to 'notes'
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'inspections' 
            AND column_name = 'observacoes'
        ) THEN
            -- Rename column to 'notes' to match TypeScript types
            ALTER TABLE public.inspections RENAME COLUMN observacoes TO notes;
        END IF;
        
        -- Ensure 'notes' column exists (if renaming didn't happen)
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'inspections' 
            AND column_name = 'notes'
        ) THEN
            -- Add 'notes' column if it doesn't exist
            ALTER TABLE public.inspections ADD COLUMN notes text;
        END IF;
    END IF;
    -- If table doesn't exist, do nothing (it will be created by the original migration)
END $$;

-- Update comment (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inspections'
    ) THEN
        COMMENT ON COLUMN public.inspections.notes IS 'General notes or observations from the inspector, including non-conformities (não conformidades).';
    END IF;
END $$;

