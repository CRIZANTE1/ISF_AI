/*
# [Remove Equipment Table]
This migration removes the legacy `equipment` table and all its references, as all equipment is now stored in specialized tables.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true (if there is data in the equipment table)
- Reversible: false

## Structure Details:
- Tables removed: `equipment`
- Foreign keys removed: `inspections.equipment_id` references to `equipment.id`
- Policies removed: All RLS policies for `equipment` table

## Security Implications:
- RLS Policies: All policies related to `equipment` table will be removed
- Auth Requirements: No changes

## WARNING:
This migration is irreversible. If you have data in the `equipment` table, you should migrate it to the specialized tables first:
- extintores
- mangueiras
- conjuntos_autonomos
- inventario_multigas
- inventario_camaras_espuma
- inventario_canhoes_monitores
- inventario_chuveiros_lava_olhos
- inventario_alarmes
- abrigos
*/

-- Drop foreign key constraint from inspections table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'inspections_equipment_id_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_equipment_id_fkey;
  END IF;
END $$;

-- Drop all RLS policies on equipment table
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can delete equipment" ON public.equipment;

-- Drop the equipment table
DROP TABLE IF EXISTS public.equipment CASCADE;

