/**
 * Edge Function para exclusão completa de conta e dados do usuário
 * 
 * Esta função deleta TODOS os dados do usuário antes de deletar a conta de autenticação.
 * Conforme requisitos LGPD/GDPR.
 * 
 * IMPORTANTE: Esta operação é IRREVERSÍVEL
 * 
 * Uso:
 * POST /functions/v1/delete-user
 * Headers: { Authorization: `Bearer ${userAccessToken}` }
 * Body: { userId: "user-id-to-delete" }
 * 
 * Permissões:
 * - Usuário pode deletar sua própria conta
 * - Admin/Dev pode deletar qualquer conta
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Token de acesso necessário.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPA_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPA_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar token do usuário
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter userId do body
    let userId: string;
    try {
      const body = await req.json();
      userId = body?.userId;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Body da requisição inválido ou ausente. Envie um JSON válido com o campo userId.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Criar cliente admin com service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar se o usuário é admin/dev ou está deletando sua própria conta
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'dev';
    const isSelfDelete = userId === user.id;

    if (!isAdmin && !isSelfDelete) {
      return new Response(
        JSON.stringify({ error: 'Você só pode deletar sua própria conta ou precisa ser admin.' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Lista completa de tabelas com dados do usuário
    const tables = [
      // Equipamentos
      'extintores',
      'mangueiras',
      'conjuntos_autonomos',
      'inventario_multigas',
      'inventario_camaras_espuma',
      'inventario_canhoes_monitores',
      'inventario_chuveiros_lava_olhos',
      'inventario_alarmes',
      'abrigos',
      'custom_equipment',
      'equipment',
      // Inspeções
      'inspecoes_scba',
      'inspecoes_multigas',
      'inspecoes_camaras_espuma',
      'inspecoes_canhoes_monitores',
      'inspecoes_chuveiros_lava_olhos',
      'inspecoes_alarmes',
      'inspecoes_abrigos',
      'inspecoes_mangueiras',
      'custom_equipment_inspections',
      'inspections',
      // Logs de ações
      'log_acoes_extintores',
      'log_acoes_scba',
      'log_acoes_multigas',
      'log_acoes_camaras_espuma',
      'log_acoes_canhoes_monitores',
      'log_acoes_chuveiros_lava_olhos',
      'log_acoes_alarmes',
      'log_acoes_abrigos',
      'log_baixa_extintores',
      // Logs de acesso/audit
      'user_action_logs',
      'user_access_logs',
      'email_logs',
      // Outros
      'locais',
      'purchases',
    ];

    console.log(`[INFO] Iniciando exclusão de dados do usuário ${userId}${isAdmin ? ' (por admin)' : ''}`);

    // 1. Deletar dados de todas as tabelas
    const deletePromises = tables.map(async (table) => {
      try {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('user_id', userId);

        if (error) {
          // Ignorar erro se tabela não existir ou coluna user_id não existir
          if (error.code !== '42P01' && error.code !== '42703') {
            console.warn(`[WARN] Erro ao deletar dados da tabela ${table}:`, error.message);
          }
        } else {
          console.log(`[SUCCESS] Dados deletados da tabela ${table}`);
        }
      } catch (err) {
        console.warn(`[WARN] Erro ao processar tabela ${table}:`, err);
      }
    });

    await Promise.all(deletePromises);

    // 2. Deletar perfil
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.warn(`[WARN] Erro ao deletar perfil:`, profileError.message);
    } else {
      console.log(`[SUCCESS] Perfil deletado`);
    }

    // 3. Deletar conta de autenticação
    console.log(`[INFO] Deletando conta de autenticação...`);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[ERROR] Erro ao deletar usuário:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao deletar conta de autenticação.',
          details: deleteError.message,
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[SUCCESS] Conta e dados do usuário ${userId} deletados com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Conta e todos os dados foram deletados com sucesso.',
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ERROR] Erro na função delete-user:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

