-- =============================================================================
-- FIX: Correções de regressão do security hardening (15/08/2026)
-- =============================================================================

-- FIX 1: Restaurar buckets como públicos
-- O app usa getPublicUrl() + <img src=...> para exibir fotos.
-- Buckets privados retornam 403 para esse padrão (sem Authorization header).
-- A RLS já controla quem pode fazer upload/delete; o flag 'public'
-- apenas libera leitura via URL direta (CDN), que é o comportamento esperado.
UPDATE storage.buckets
  SET public = true
  WHERE id IN ('evidence-photos', 'avatars');

-- FIX 2: Re-grant de block_ip e create_security_alert para authenticated
-- Essas funções são chamadas pelo painel admin via supabase.rpc().
-- Já possuem verificação interna de is_admin(); revogar de authenticated
-- as tornava inacessíveis a todos (inclusive admins).
GRANT EXECUTE ON FUNCTION public.block_ip(inet, text, timestamp with time zone, uuid, jsonb)
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_security_alert(text, text, text, text, uuid, inet, text, text, jsonb)
  TO authenticated;
