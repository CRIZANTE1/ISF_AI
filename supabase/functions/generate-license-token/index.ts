/**
 * Edge Function: generate-license-token
 *
 * Gera token de ativação de licença SERVER-SIDE para que o LICENSE_SECRET
 * nunca seja exposto no bundle do cliente (APK).
 *
 * Apenas administradores podem chamar esta função.
 *
 * POST /functions/v1/generate-license-token
 * Headers: { Authorization: `Bearer ${userAccessToken}` }
 * Body: { machineId: string, installDate: string }
 *
 * Response: { success: true, token: string }
 *         | { error: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Gera hash SHA-256 de uma string usando a API nativa do Deno/Web Crypto.
 * Mantém o mesmo algoritmo utilizado anteriormente no cliente.
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  // Autenticação
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Não autorizado. Token de acesso necessário.' }, 401);
  }

  // Variáveis de ambiente do Supabase (injetadas automaticamente)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const licenseSecret = Deno.env.get('LICENSE_SECRET') ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERROR] Variáveis de ambiente do Supabase não configuradas.');
    return jsonResponse({ error: 'Configuração do servidor inválida.' }, 500);
  }

  if (!licenseSecret) {
    console.error('[ERROR] LICENSE_SECRET não configurado. Execute: supabase secrets set LICENSE_SECRET=...');
    return jsonResponse({ error: 'Segredo de licença não configurado no servidor.' }, 500);
  }

  // Validar token do usuário e obter identidade
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Token inválido ou expirado.' }, 401);
  }

  // Verificar se o caller é admin
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[ERROR] Erro ao buscar perfil do usuário:', profileError?.message);
    return jsonResponse({ error: 'Erro ao verificar permissões.' }, 500);
  }

  if (profile.role !== 'admin' && profile.role !== 'dev') {
    return jsonResponse({ error: 'Acesso negado. Apenas administradores podem gerar tokens de licença.' }, 403);
  }

  // Extrair e validar body
  let machineId: string;
  let installDate: string;

  try {
    const body = await req.json();
    machineId = body?.machineId;
    installDate = body?.installDate;
  } catch {
    return jsonResponse({ error: 'Body inválido. Envie JSON com machineId e installDate.' }, 400);
  }

  if (!machineId || typeof machineId !== 'string') {
    return jsonResponse({ error: 'machineId é obrigatório.' }, 400);
  }

  if (!installDate || typeof installDate !== 'string') {
    return jsonResponse({ error: 'installDate é obrigatório.' }, 400);
  }

  // Verificar se a licença existe
  const { data: license, error: licenseError } = await adminClient
    .from('licenses')
    .select('id, machine_id, install_date')
    .eq('machine_id', machineId)
    .maybeSingle();

  if (licenseError) {
    console.error('[ERROR] Erro ao buscar licença:', licenseError.message);
    return jsonResponse({ error: 'Erro ao buscar licença.' }, 500);
  }

  if (!license) {
    return jsonResponse({ error: `Licença não encontrada para machine_id: ${machineId}` }, 404);
  }

  try {
    // Calcular data de expiração: installDate + 1 ano
    const expiration = new Date(installDate);
    expiration.setFullYear(expiration.getFullYear() + 1);

    // Mesmo algoritmo usado anteriormente no cliente — garante compatibilidade
    // de formato com tokens já emitidos
    const data = `${machineId}-${installDate}-${expiration.toISOString()}-${licenseSecret}`;
    const hash = await hashString(data);
    const token = hash.substring(0, 32).toUpperCase().match(/.{1,4}/g)?.join('-') ?? '';

    // Atualizar licença no banco como PREMIUM
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from('licenses')
      .update({
        activation_token: token,
        last_activation_date: now,
        license_type: 'premium',
      })
      .eq('machine_id', machineId);

    if (updateError) {
      console.error('[ERROR] Erro ao atualizar licença:', updateError.message);
      return jsonResponse({ error: 'Erro ao atualizar licença no banco de dados.' }, 500);
    }

    console.log(`[SUCCESS] Token gerado para machine_id ${machineId} por admin ${user.email}`);

    return jsonResponse({ success: true, token });
  } catch (err) {
    console.error('[ERROR] Erro inesperado ao gerar token:', err);
    return jsonResponse({
      error: 'Erro interno ao gerar token.',
      details: err instanceof Error ? err.message : 'Erro desconhecido',
    }, 500);
  }
});
