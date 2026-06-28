-- Cron jobs para notificações de engajamento (push FCM)
-- Pré-requisitos: extensões pg_cron e pg_net; secrets no Vault:
--   supabase_url  -> https://SEU_PROJETO.supabase.co
--   cron_secret   -> mesmo valor de CRON_SECRET das Edge Functions

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_weekly_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url text;
  cron_secret text;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;

  IF project_url IS NULL OR cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'notify_weekly_summary: configure vault secrets supabase_url e cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/notify-weekly-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_engagement_streak()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url text;
  cron_secret text;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;

  IF project_url IS NULL OR cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'notify_engagement_streak: configure vault secrets supabase_url e cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/notify-engagement-streak',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enviar_lembrete_inatividade()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url text;
  cron_secret text;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;

  IF project_url IS NULL OR cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'enviar_lembrete_inatividade: configure vault secrets supabase_url e cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/enviar-lembrete-inatividade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Segunda 8h UTC — resumo semanal
SELECT cron.schedule(
  'notify-weekly-summary',
  '0 8 * * 1',
  $$ SELECT public.notify_weekly_summary(); $$
);

-- Diário 9h UTC — sequência de inspeções
SELECT cron.schedule(
  'notify-engagement-streak',
  '0 9 * * *',
  $$ SELECT public.notify_engagement_streak(); $$
);

-- Segunda 11h UTC — lembrete de inatividade
SELECT cron.schedule(
  'enviar-lembrete-inatividade',
  '0 11 * * 1',
  $$ SELECT public.enviar_lembrete_inatividade(); $$
);
