-- Migration to add latitude, longitude, and numero_serie columns to equipment tables
-- This migration adds GPS coordinates and serial number support to all equipment types

-- 1. Chuveiros/Lava-olhos
ALTER TABLE public.inventario_chuveiros_lava_olhos 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- 2. Câmaras de Espuma
ALTER TABLE public.inventario_camaras_espuma 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- 3. Canhões Monitores
ALTER TABLE public.inventario_canhoes_monitores 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- 4. Abrigos
ALTER TABLE public.abrigos 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.inventario_chuveiros_lava_olhos.latitude IS 'Latitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_chuveiros_lava_olhos.longitude IS 'Longitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_chuveiros_lava_olhos.numero_serie IS 'Número de série do equipamento (opcional)';

COMMENT ON COLUMN public.inventario_camaras_espuma.latitude IS 'Latitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_camaras_espuma.longitude IS 'Longitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_camaras_espuma.numero_serie IS 'Número de série do equipamento (opcional)';

COMMENT ON COLUMN public.inventario_canhoes_monitores.latitude IS 'Latitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_canhoes_monitores.longitude IS 'Longitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.inventario_canhoes_monitores.numero_serie IS 'Número de série do equipamento (opcional)';

COMMENT ON COLUMN public.abrigos.latitude IS 'Latitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.abrigos.longitude IS 'Longitude GPS do equipamento (opcional)';
COMMENT ON COLUMN public.abrigos.numero_serie IS 'Número de série do equipamento (opcional)';

