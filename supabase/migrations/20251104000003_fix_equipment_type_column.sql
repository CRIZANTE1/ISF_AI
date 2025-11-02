/*
# [Operation] Fix Equipment Type Column Name
This script ensures the equipment table has a 'type' column that matches the TypeScript types.
The column 'equipment_type' in the database should be accessible as 'type' in the client.

## Query Description:
This script adds a 'type' column as an alias for 'equipment_type', or creates a view
that maps equipment_type to type. This ensures compatibility with the TypeScript client.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: `equipment`
- Column: Adds 'type' column or creates view

## Security Implications:
- RLS Status: No changes to RLS policies
- Policy Changes: None
- Auth Requirements: Requires database admin privileges

## Performance Impact:
- Indexes: No new indexes
- Triggers: None
- Estimated Impact: Low
*/

-- Option 1: Add 'type' as a generated column that references 'equipment_type'
DO $$
BEGIN
    -- Check if 'type' column doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'equipment' 
        AND column_name = 'type'
    ) THEN
        -- Add 'type' column as a generated column (computed from equipment_type)
        ALTER TABLE public.equipment 
        ADD COLUMN type text GENERATED ALWAYS AS (equipment_type::text) STORED;
        
        -- Add comment
        COMMENT ON COLUMN public.equipment.type IS 'Type of equipment (alias for equipment_type).';
    END IF;
END $$;

