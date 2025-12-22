-- Migration to add ON DELETE CASCADE to all user-related foreign keys
-- This ensures complete account deletion when a user is removed
-- Run this in your Supabase SQL Editor

-- Disable triggers to avoid recursion/loops during modification if necessary
-- SET session_replication_role = 'replica';

-- 1. Profiles (Usually cascades from auth.users, but good to check)
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Equipment Tables (Add FKs if missing or alter to CASCADE)

-- Extintores
ALTER TABLE public.extintores DROP CONSTRAINT IF EXISTS extintores_user_id_fkey;
ALTER TABLE public.extintores ADD CONSTRAINT extintores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mangueiras
ALTER TABLE public.mangueiras DROP CONSTRAINT IF EXISTS mangueiras_user_id_fkey;
ALTER TABLE public.mangueiras ADD CONSTRAINT mangueiras_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Abrigos
ALTER TABLE public.abrigos DROP CONSTRAINT IF EXISTS abrigos_user_id_fkey;
ALTER TABLE public.abrigos ADD CONSTRAINT abrigos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- SCBAs (Conjuntos Autonomos)
ALTER TABLE public.conjuntos_autonomos DROP CONSTRAINT IF EXISTS conjuntos_autonomos_user_id_fkey;
ALTER TABLE public.conjuntos_autonomos ADD CONSTRAINT conjuntos_autonomos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Chuveiros/Lava-olhos
ALTER TABLE public.inventario_chuveiros_lava_olhos DROP CONSTRAINT IF EXISTS inventario_chuveiros_lava_olhos_user_id_fkey;
ALTER TABLE public.inventario_chuveiros_lava_olhos ADD CONSTRAINT inventario_chuveiros_lava_olhos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Camaras de Espuma
ALTER TABLE public.inventario_camaras_espuma DROP CONSTRAINT IF EXISTS inventario_camaras_espuma_user_id_fkey;
ALTER TABLE public.inventario_camaras_espuma ADD CONSTRAINT inventario_camaras_espuma_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Multigas
ALTER TABLE public.inventario_multigas DROP CONSTRAINT IF EXISTS inventario_multigas_user_id_fkey;
ALTER TABLE public.inventario_multigas ADD CONSTRAINT inventario_multigas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alarmes
ALTER TABLE public.inventario_alarmes DROP CONSTRAINT IF EXISTS inventario_alarmes_user_id_fkey;
ALTER TABLE public.inventario_alarmes ADD CONSTRAINT inventario_alarmes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Canhoes Monitores
ALTER TABLE public.inventario_canhoes_monitores DROP CONSTRAINT IF EXISTS inventario_canhoes_monitores_user_id_fkey;
ALTER TABLE public.inventario_canhoes_monitores ADD CONSTRAINT inventario_canhoes_monitores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Generic Equipment Table
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_user_id_fkey;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Locais
ALTER TABLE public.locais DROP CONSTRAINT IF EXISTS locais_user_id_fkey;
ALTER TABLE public.locais ADD CONSTRAINT locais_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Inspection Tables (Should also cascade from User OR Equipment - cascading from User is safer for account wipe)

ALTER TABLE public.inspecoes_scba DROP CONSTRAINT IF EXISTS inspecoes_scba_user_id_fkey;
ALTER TABLE public.inspecoes_scba ADD CONSTRAINT inspecoes_scba_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_multigas DROP CONSTRAINT IF EXISTS inspecoes_multigas_user_id_fkey;
ALTER TABLE public.inspecoes_multigas ADD CONSTRAINT inspecoes_multigas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_camaras_espuma DROP CONSTRAINT IF EXISTS inspecoes_camaras_espuma_user_id_fkey;
ALTER TABLE public.inspecoes_camaras_espuma ADD CONSTRAINT inspecoes_camaras_espuma_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_canhoes_monitores DROP CONSTRAINT IF EXISTS inspecoes_canhoes_monitores_user_id_fkey;
ALTER TABLE public.inspecoes_canhoes_monitores ADD CONSTRAINT inspecoes_canhoes_monitores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_chuveiros_lava_olhos DROP CONSTRAINT IF EXISTS inspecoes_chuveiros_lava_olhos_user_id_fkey;
ALTER TABLE public.inspecoes_chuveiros_lava_olhos ADD CONSTRAINT inspecoes_chuveiros_lava_olhos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_alarmes DROP CONSTRAINT IF EXISTS inspecoes_alarmes_user_id_fkey;
ALTER TABLE public.inspecoes_alarmes ADD CONSTRAINT inspecoes_alarmes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.inspecoes_abrigos DROP CONSTRAINT IF EXISTS inspecoes_abrigos_user_id_fkey;
ALTER TABLE public.inspecoes_abrigos ADD CONSTRAINT inspecoes_abrigos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Log Tables

ALTER TABLE public.log_acoes_extintores DROP CONSTRAINT IF EXISTS log_acoes_extintores_user_id_fkey;
ALTER TABLE public.log_acoes_extintores ADD CONSTRAINT log_acoes_extintores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_scba DROP CONSTRAINT IF EXISTS log_acoes_scba_user_id_fkey;
ALTER TABLE public.log_acoes_scba ADD CONSTRAINT log_acoes_scba_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_multigas DROP CONSTRAINT IF EXISTS log_acoes_multigas_user_id_fkey;
ALTER TABLE public.log_acoes_multigas ADD CONSTRAINT log_acoes_multigas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_camaras_espuma DROP CONSTRAINT IF EXISTS log_acoes_camaras_espuma_user_id_fkey;
ALTER TABLE public.log_acoes_camaras_espuma ADD CONSTRAINT log_acoes_camaras_espuma_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_canhoes_monitores DROP CONSTRAINT IF EXISTS log_acoes_canhoes_monitores_user_id_fkey;
ALTER TABLE public.log_acoes_canhoes_monitores ADD CONSTRAINT log_acoes_canhoes_monitores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_chuveiros_lava_olhos DROP CONSTRAINT IF EXISTS log_acoes_chuveiros_lava_olhos_user_id_fkey;
ALTER TABLE public.log_acoes_chuveiros_lava_olhos ADD CONSTRAINT log_acoes_chuveiros_lava_olhos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_alarmes DROP CONSTRAINT IF EXISTS log_acoes_alarmes_user_id_fkey;
ALTER TABLE public.log_acoes_alarmes ADD CONSTRAINT log_acoes_alarmes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_acoes_abrigos DROP CONSTRAINT IF EXISTS log_acoes_abrigos_user_id_fkey;
ALTER TABLE public.log_acoes_abrigos ADD CONSTRAINT log_acoes_abrigos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.log_baixa_extintores DROP CONSTRAINT IF EXISTS log_baixa_extintores_user_id_fkey;
ALTER TABLE public.log_baixa_extintores ADD CONSTRAINT log_baixa_extintores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Access Logs (If applicable, though sometimes we want to keep these for audit)
-- To be safe with GDPR/LGPD "Right to be Forgotten", we should cascade delete them too
ALTER TABLE public.user_action_logs DROP CONSTRAINT IF EXISTS user_action_logs_user_id_fkey;
ALTER TABLE public.user_action_logs ADD CONSTRAINT user_action_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_access_logs DROP CONSTRAINT IF EXISTS user_access_logs_user_id_fkey;
ALTER TABLE public.user_access_logs ADD CONSTRAINT user_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-enable triggers
-- SET session_replication_role = 'origin';
