-- Adicionar colunas de latitude e longitude nas tabelas de inspeção
-- para registrar automaticamente a localização onde a inspeção foi realizada

-- Tabela de Inspeções Chuveiros/Lava-olhos
ALTER TABLE public.inspecoes_chuveiros_lava_olhos
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Tabela de Inspeções Câmaras de Espuma
ALTER TABLE public.inspecoes_camaras_espuma
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Tabela de Inspeções Canhões Monitores
ALTER TABLE public.inspecoes_canhoes_monitores
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Tabela de Inspeções Alarmes
ALTER TABLE public.inspecoes_alarmes
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Tabela de Inspeções Abrigos
ALTER TABLE public.inspecoes_abrigos
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Comentários para documentação
COMMENT ON COLUMN public.inspecoes_chuveiros_lava_olhos.latitude IS 'Latitude onde a inspeção foi realizada (capturada automaticamente)';
COMMENT ON COLUMN public.inspecoes_chuveiros_lava_olhos.longitude IS 'Longitude onde a inspeção foi realizada (capturada automaticamente)';

COMMENT ON COLUMN public.inspecoes_camaras_espuma.latitude IS 'Latitude onde a inspeção foi realizada (capturada automaticamente)';
COMMENT ON COLUMN public.inspecoes_camaras_espuma.longitude IS 'Longitude onde a inspeção foi realizada (capturada automaticamente)';

COMMENT ON COLUMN public.inspecoes_canhoes_monitores.latitude IS 'Latitude onde a inspeção foi realizada (capturada automaticamente)';
COMMENT ON COLUMN public.inspecoes_canhoes_monitores.longitude IS 'Longitude onde a inspeção foi realizada (capturada automaticamente)';

COMMENT ON COLUMN public.inspecoes_alarmes.latitude IS 'Latitude onde a inspeção foi realizada (capturada automaticamente)';
COMMENT ON COLUMN public.inspecoes_alarmes.longitude IS 'Longitude onde a inspeção foi realizada (capturada automaticamente)';

COMMENT ON COLUMN public.inspecoes_abrigos.latitude IS 'Latitude onde a inspeção foi realizada (capturada automaticamente)';
COMMENT ON COLUMN public.inspecoes_abrigos.longitude IS 'Longitude onde a inspeção foi realizada (capturada automaticamente)';

-- Nota: A tabela extintores já possui latitude e longitude (definida na migração inicial)

