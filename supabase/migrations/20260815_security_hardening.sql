-- =============================================================================
-- Security hardening — 2026-08-15
-- Corrige: RLS email_logs, licenses, profiles privilege escalation, IDOR,
-- JWT hardcoded em funções SQL, RPCs SECURITY DEFINER públicas, storage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is_admin() (SECURITY DEFINER) — evita recursão em policies de profiles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1a. email_logs — habilitar RLS e revogar grants excessivos
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_logs FROM anon;
REVOKE ALL ON TABLE public.email_logs FROM authenticated;

DROP POLICY IF EXISTS "email_logs_service_only" ON public.email_logs;
-- Sem policies para anon/authenticated: apenas service_role (bypass RLS) acessa.

-- -----------------------------------------------------------------------------
-- 1b. licenses — corrigir USING (true)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can read their own licenses" ON public.licenses;

CREATE POLICY "licenses_read_own" ON public.licenses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "licenses_admin_manage" ON public.licenses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE TRUNCATE ON TABLE public.licenses FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1c. profiles — bloquear auto-promoção de role / plan / dev
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_row" ON public.profiles;

CREATE POLICY "profiles_update_own_safe" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role / sem JWT (triggers internos) e admins podem alterar tudo
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.role := OLD.role;
  NEW.plan := OLD.plan;
  NEW.dev  := OLD.dev;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_privilege ON public.profiles;
CREATE TRIGGER enforce_profile_privilege
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- -----------------------------------------------------------------------------
-- 1d. profiles SELECT — restringir enumeração (com is_admin para evitar recursão)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- Atualizar policy de admin update para usar is_admin()
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.profiles FROM anon;

-- -----------------------------------------------------------------------------
-- 1e. IDOR — dropar policies auth.role() = 'authenticated'
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage shelters inspections" ON public.inspecoes_abrigos;
DROP POLICY IF EXISTS "Authenticated users can manage alarms inspections" ON public.inspecoes_alarmes;
DROP POLICY IF EXISTS "Authenticated users can manage foam chambers inspections" ON public.inspecoes_camaras_espuma;
DROP POLICY IF EXISTS "Authenticated users can manage monitor cannons inspections" ON public.inspecoes_canhoes_monitores;
DROP POLICY IF EXISTS "Authenticated users can manage eyewash stations inspections" ON public.inspecoes_chuveiros_lava_olhos;
DROP POLICY IF EXISTS "Authenticated users can manage alarms inventory" ON public.inventario_alarmes;
DROP POLICY IF EXISTS "Authenticated users can manage shelters action logs" ON public.log_acoes_abrigos;
DROP POLICY IF EXISTS "Authenticated users can manage alarms action logs" ON public.log_acoes_alarmes;
DROP POLICY IF EXISTS "Authenticated users can manage foam chambers action logs" ON public.log_acoes_camaras_espuma;
DROP POLICY IF EXISTS "Authenticated users can manage monitor cannons action logs" ON public.log_acoes_canhoes_monitores;
DROP POLICY IF EXISTS "Authenticated users can manage eyewash stations action logs" ON public.log_acoes_chuveiros_lava_olhos;
DROP POLICY IF EXISTS "Authenticated users can manage extinguisher disposal logs" ON public.log_baixa_extintores;

-- Garantir policies por user_id onde faltarem (CREATE IF NOT EXISTS via drop+create)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'inspecoes_abrigos',
    'inspecoes_alarmes',
    'inspecoes_camaras_espuma',
    'inspecoes_canhoes_monitores',
    'inspecoes_chuveiros_lava_olhos'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users manage own ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      'Users manage own ' || t, t
    );
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 1f. Equipamentos/logs órfãos — remover OR user_id IS NULL
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own extinguishers" ON public.extintores;
CREATE POLICY "Users can manage their own extinguishers" ON public.extintores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own shelters" ON public.abrigos;
CREATE POLICY "Users can manage their own shelters" ON public.abrigos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own hoses" ON public.mangueiras;
CREATE POLICY "Users can manage their own hoses" ON public.mangueiras
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own SCBA" ON public.conjuntos_autonomos;
CREATE POLICY "Users can manage their own SCBA" ON public.conjuntos_autonomos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own multigas inventory" ON public.inventario_multigas;
CREATE POLICY "Users can manage their own multigas inventory" ON public.inventario_multigas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own foam chambers inventory" ON public.inventario_camaras_espuma;
CREATE POLICY "Users can manage their own foam chambers inventory" ON public.inventario_camaras_espuma
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own monitor cannons inventory" ON public.inventario_canhoes_monitores;
CREATE POLICY "Users can manage their own monitor cannons inventory" ON public.inventario_canhoes_monitores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own eyewash stations inventory" ON public.inventario_chuveiros_lava_olhos;
CREATE POLICY "Users can manage their own eyewash stations inventory" ON public.inventario_chuveiros_lava_olhos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own alarm systems inventory" ON public.inventario_alarmes;
CREATE POLICY "Users can manage their own alarm systems inventory" ON public.inventario_alarmes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own extinguisher action logs" ON public.log_acoes_extintores;
CREATE POLICY "Users can manage their own extinguisher action logs" ON public.log_acoes_extintores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own shelter action logs" ON public.log_acoes_abrigos;
CREATE POLICY "Users can manage their own shelter action logs" ON public.log_acoes_abrigos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own alarm action logs" ON public.log_acoes_alarmes;
CREATE POLICY "Users can manage their own alarm action logs" ON public.log_acoes_alarmes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own foam chamber action logs" ON public.log_acoes_camaras_espuma;
CREATE POLICY "Users can manage their own foam chamber action logs" ON public.log_acoes_camaras_espuma
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cannon monitor action logs" ON public.log_acoes_canhoes_monitores;
CREATE POLICY "Users can manage their own cannon monitor action logs" ON public.log_acoes_canhoes_monitores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own eyewash action logs" ON public.log_acoes_chuveiros_lava_olhos;
CREATE POLICY "Users can manage their own eyewash action logs" ON public.log_acoes_chuveiros_lava_olhos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own multigas action logs" ON public.log_acoes_multigas;
CREATE POLICY "Users can manage their own multigas action logs" ON public.log_acoes_multigas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own SCBA action logs" ON public.log_acoes_scba;
CREATE POLICY "Users can manage their own SCBA action logs" ON public.log_acoes_scba
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow read for legacy reservoirs without user_id" ON public.water_reservoirs;
DROP POLICY IF EXISTS "Users can manage their own water reservoirs" ON public.water_reservoirs;
CREATE POLICY "Users can manage their own water reservoirs" ON public.water_reservoirs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- log_baixa_extintores — policy scoped
DROP POLICY IF EXISTS "Users manage own log_baixa_extintores" ON public.log_baixa_extintores;
CREATE POLICY "Users manage own log_baixa_extintores" ON public.log_baixa_extintores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 1g. Insert irrestrito em logs de auditoria
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;
CREATE POLICY "security_alerts_insert_authenticated" ON public.security_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert access logs" ON public.user_access_logs;
CREATE POLICY "user_access_logs_insert_authenticated" ON public.user_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert action logs" ON public.user_action_logs;
CREATE POLICY "user_action_logs_insert_authenticated" ON public.user_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 1h. REVOKE EXECUTE nas RPCs admin/cron (manter log_* e generate_unique_equipment_id)
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.associate_license_to_user(text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.associate_all_licenses_to_most_active_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.associate_licenses_to_users() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deletar_usuarios_com_aviso_expirado() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.limpar_usuarios_inativos() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_unassociated_licenses() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_alertas_vencimento() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_lembrete_inatividade() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_notificacao_trial_expirando() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_notificacoes_dev() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_notificacoes_pendencias() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_relatorio_diario() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_relatorio_mensal() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enviar_relatorio_semanal() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_engagement_streak() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_weekly_summary() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_failed_logins_and_block() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_profile_exists(uuid) FROM anon, authenticated, PUBLIC;

-- block_ip / create_security_alert / cleanup_old_logs_v2: apenas autenticados com is_admin
REVOKE EXECUTE ON FUNCTION public.block_ip(inet, text, timestamptz, uuid, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_security_alert(text, text, text, text, uuid, inet, text, text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs_v2() FROM anon, PUBLIC;

-- -----------------------------------------------------------------------------
-- Helper de cron removido: não embutir secrets no SQL.
-- Wrappers abaixo falham de propósito — agende Edge Functions no Dashboard
-- com Authorization: Bearer CRON_SECRET.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1i. Remover JWT hardcoded + reescrever wrappers e triggers
-- -----------------------------------------------------------------------------

-- on_new_user: apenas retorna NEW (profile criado por handle_new_user; e-mail via Auth Hook)
CREATE OR REPLACE FUNCTION public.on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- E-mail de boas-vindas deve ser configurado via Auth Hook / Dashboard.
  -- Nunca embutir service_role JWT aqui.
  RETURN NEW;
END;
$$;

-- handle_new_user: forçar role = 'user' (ignorar metadata.role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'user'::user_role,
    'trial'::user_plan,
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- on_user_upgrade: sem JWT
CREATE OR REPLACE FUNCTION public.on_user_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificação de upgrade deve usar Auth Hook / Edge Function com secret no Vault.
  RETURN NEW;
END;
$$;

-- Wrappers de cron: sem secrets embutidos. Chamar Edge Functions com CRON_SECRET.
CREATE OR REPLACE FUNCTION public.limpar_usuarios_inativos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function limpar-usuarios-inativos com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.deletar_usuarios_com_aviso_expirado()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function deletar-usuarios-com-aviso-expirado com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_relatorio_diario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-relatorio-diario com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_relatorio_mensal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-relatorio-mensal com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_relatorio_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-relatorio-semanal com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_notificacoes_pendencias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-notificacoes-pendencias com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_notificacoes_dev()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-notificacoes-dev com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_alertas_vencimento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-alertas-vencimento com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_notificacao_trial_expirando()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Chame a Edge Function enviar-notificacao-trial-expirando com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;

DROP FUNCTION IF EXISTS public.cleanup_old_logs_v2();
CREATE FUNCTION public.cleanup_old_logs_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem limpar logs';
  END IF;
  RAISE EXCEPTION 'Chame a Edge Function cleanup-old-logs-v2 com Authorization Bearer CRON_SECRET (nao use RPC).';
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_old_logs_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs_v2() TO authenticated;

-- -----------------------------------------------------------------------------
-- 1j. Fix search_path mutável
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'associate_all_licenses_to_most_active_user',
        'associate_license_to_user',
        'associate_licenses_to_users',
        'block_ip',
        'check_failed_logins_and_block',
        'cleanup_old_logs',
        'create_security_alert',
        'generate_unique_equipment_id',
        'is_ip_blocked',
        'list_unassociated_licenses',
        'log_user_access',
        'log_user_action',
        'update_purchases_updated_at',
        'update_updated_at_column'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Storage — isolamento por pasta {uid}/
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can delete evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload evidence photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Novos uploads exigem pasta {uid}/...; SELECT/UPDATE/DELETE também
-- aceitam objetos legados cujo owner = auth.uid().
CREATE POLICY "evidence_photos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

CREATE POLICY "evidence_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "evidence_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'evidence-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

CREATE POLICY "evidence_photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'evidence-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR owner = auth.uid()
    )
  );

-- Tornar buckets privados (se a API permitir via SQL)
UPDATE storage.buckets
SET public = false
WHERE id IN ('evidence-photos', 'avatars');

-- -----------------------------------------------------------------------------
-- Admin RPC: listar usuários (fallback seguro para AdminUsersPage)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  profile jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    jsonb_build_object(
      'full_name', p.full_name,
      'role', p.role,
      'plan', p.plan,
      'trial_ends_at', p.trial_ends_at,
      'dev', p.dev
    ) AS profile
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_users_with_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;

-- Revogar EXECUTE de triggers/helpers que não devem ser RPCs públicas
REVOKE EXECUTE ON FUNCTION public.cleanup_old_logs_v2() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_user_upgrade() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_privilege_escalation() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_unique_equipment_id(text, text, text, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_equipment_id(text, text, text, uuid) TO authenticated;
