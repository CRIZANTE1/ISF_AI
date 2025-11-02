/*
# [Fix RLS Policies - User Data Isolation]
This migration fixes critical security vulnerability where authenticated users could access ALL equipment data instead of only their own.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Critical"
- Requires-Backup: false
- Reversible: false

## Security Issue Fixed:
The previous RLS policies used `auth.role() = 'authenticated'::text` which allows ANY authenticated user to see/modify ALL records.
This fix changes policies to use `auth.uid() = user_id` to ensure users can only access their own data.

## Tables Fixed:
- extintores
- mangueiras
- conjuntos_autonomos
- inventario_multigas
- inventario_camaras_espuma
- inventario_canhoes_monitores
- inventario_chuveiros_lava_olhos
- inventario_alarmes
- abrigos
- inspecoes_scba
- inspecoes_multigas
- inspecoes_camaras_espuma
- inspecoes_canhoes_monitores
- inspecoes_chuveiros_lava_olhos
- inspecoes_alarmes
- inspecoes_abrigos
- log_acoes_extintores
- log_acoes_scba
- log_acoes_multigas
- log_acoes_camaras_espuma
- log_acoes_canhoes_monitores
- log_acoes_chuveiros_lava_olhos
- log_acoes_alarmes
- log_acoes_abrigos
- locais
*/

-- ============================================
-- TABELAS DE INVENTÁRIO
-- ============================================

-- Extintores
DROP POLICY IF EXISTS "Authenticated users can manage extinguishers" ON public.extintores;
CREATE POLICY "Users can manage their own extinguishers"
    ON public.extintores FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Mangueiras
DROP POLICY IF EXISTS "Authenticated users can manage hoses" ON public.mangueiras;
CREATE POLICY "Users can manage their own hoses"
    ON public.mangueiras FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Conjuntos Autônomos (SCBA)
DROP POLICY IF EXISTS "Authenticated users can manage SCBA" ON public.conjuntos_autonomos;
CREATE POLICY "Users can manage their own SCBA"
    ON public.conjuntos_autonomos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inventário Multigás
DROP POLICY IF EXISTS "Authenticated users can manage multigas inventory" ON public.inventario_multigas;
CREATE POLICY "Users can manage their own multigas inventory"
    ON public.inventario_multigas FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inventário Câmaras de Espuma
DROP POLICY IF EXISTS "Authenticated users can manage foam chambers inventory" ON public.inventario_camaras_espuma;
CREATE POLICY "Users can manage their own foam chambers inventory"
    ON public.inventario_camaras_espuma FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inventário Canhões Monitores
DROP POLICY IF EXISTS "Authenticated users can manage monitor cannons inventory" ON public.inventario_canhoes_monitores;
CREATE POLICY "Users can manage their own monitor cannons inventory"
    ON public.inventario_canhoes_monitores FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inventário Chuveiros/Lava-olhos
DROP POLICY IF EXISTS "Authenticated users can manage eyewash stations inventory" ON public.inventario_chuveiros_lava_olhos;
CREATE POLICY "Users can manage their own eyewash stations inventory"
    ON public.inventario_chuveiros_lava_olhos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inventário Alarmes
DROP POLICY IF EXISTS "Authenticated users can manage alarm systems inventory" ON public.inventario_alarmes;
CREATE POLICY "Users can manage their own alarm systems inventory"
    ON public.inventario_alarmes FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Abrigos
DROP POLICY IF EXISTS "Authenticated users can manage shelters" ON public.abrigos;
CREATE POLICY "Users can manage their own shelters"
    ON public.abrigos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- TABELAS DE INSPEÇÃO
-- ============================================

-- Inspeções SCBA
DROP POLICY IF EXISTS "Authenticated users can manage SCBA inspections" ON public.inspecoes_scba;
CREATE POLICY "Users can manage their own SCBA inspections"
    ON public.inspecoes_scba FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Multigás
DROP POLICY IF EXISTS "Authenticated users can manage multigas inspections" ON public.inspecoes_multigas;
CREATE POLICY "Users can manage their own multigas inspections"
    ON public.inspecoes_multigas FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Câmaras de Espuma
DROP POLICY IF EXISTS "Authenticated users can manage foam chamber inspections" ON public.inspecoes_camaras_espuma;
CREATE POLICY "Users can manage their own foam chamber inspections"
    ON public.inspecoes_camaras_espuma FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Canhões Monitores
DROP POLICY IF EXISTS "Authenticated users can manage cannon monitor inspections" ON public.inspecoes_canhoes_monitores;
CREATE POLICY "Users can manage their own cannon monitor inspections"
    ON public.inspecoes_canhoes_monitores FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Chuveiros/Lava-olhos
DROP POLICY IF EXISTS "Authenticated users can manage eyewash inspections" ON public.inspecoes_chuveiros_lava_olhos;
CREATE POLICY "Users can manage their own eyewash inspections"
    ON public.inspecoes_chuveiros_lava_olhos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Alarmes
DROP POLICY IF EXISTS "Authenticated users can manage alarm inspections" ON public.inspecoes_alarmes;
CREATE POLICY "Users can manage their own alarm inspections"
    ON public.inspecoes_alarmes FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Inspeções Abrigos
DROP POLICY IF EXISTS "Authenticated users can manage shelter inspections" ON public.inspecoes_abrigos;
CREATE POLICY "Users can manage their own shelter inspections"
    ON public.inspecoes_abrigos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- TABELAS DE LOG DE AÇÕES
-- ============================================

-- Log de Ações Extintores
DROP POLICY IF EXISTS "Authenticated users can manage extinguisher action logs" ON public.log_acoes_extintores;
CREATE POLICY "Users can manage their own extinguisher action logs"
    ON public.log_acoes_extintores FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações SCBA
DROP POLICY IF EXISTS "Authenticated users can manage SCBA action logs" ON public.log_acoes_scba;
CREATE POLICY "Users can manage their own SCBA action logs"
    ON public.log_acoes_scba FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Multigás
DROP POLICY IF EXISTS "Authenticated users can manage multigas action logs" ON public.log_acoes_multigas;
CREATE POLICY "Users can manage their own multigas action logs"
    ON public.log_acoes_multigas FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Câmaras de Espuma
DROP POLICY IF EXISTS "Authenticated users can manage foam chamber action logs" ON public.log_acoes_camaras_espuma;
CREATE POLICY "Users can manage their own foam chamber action logs"
    ON public.log_acoes_camaras_espuma FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Canhões Monitores
DROP POLICY IF EXISTS "Authenticated users can manage cannon monitor action logs" ON public.log_acoes_canhoes_monitores;
CREATE POLICY "Users can manage their own cannon monitor action logs"
    ON public.log_acoes_canhoes_monitores FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Chuveiros/Lava-olhos
DROP POLICY IF EXISTS "Authenticated users can manage eyewash action logs" ON public.log_acoes_chuveiros_lava_olhos;
CREATE POLICY "Users can manage their own eyewash action logs"
    ON public.log_acoes_chuveiros_lava_olhos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Alarmes
DROP POLICY IF EXISTS "Authenticated users can manage alarm action logs" ON public.log_acoes_alarmes;
CREATE POLICY "Users can manage their own alarm action logs"
    ON public.log_acoes_alarmes FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Log de Ações Abrigos
DROP POLICY IF EXISTS "Authenticated users can manage shelter action logs" ON public.log_acoes_abrigos;
CREATE POLICY "Users can manage their own shelter action logs"
    ON public.log_acoes_abrigos FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- TABELAS AUXILIARES
-- ============================================

-- Locais
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON public.locais;
CREATE POLICY "Users can manage their own locations"
    ON public.locais FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

