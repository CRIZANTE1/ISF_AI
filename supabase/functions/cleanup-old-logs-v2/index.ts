/**
 * Edge Function para limpar logs antigos baseado na configuração do app
 * 
 * Esta função:
 * 1. Busca a configuração de retenção da tabela log_retention_config
 * 2. Apaga logs de ações (user_action_logs) com mais de action_logs_retention_days dias
 * 3. Apaga logs de acesso (user_access_logs) com mais de access_logs_retention_days dias
 * 4. Atualiza a configuração de retenção com a data da última limpeza
 * 
 * Uso:
 * POST /functions/v1/cleanup-old-logs-v2
 * (Pode ser chamada via cron job ou manualmente)
 * 
 * Configuração Cron (recomendado: semanal):
 * 0 2 * * 0 (todo domingo às 2h UTC)
 * 
 * NOTA: Os dias de retenção são configuráveis no app através da tabela log_retention_config
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

  const authHeader = req.headers.get('Authorization') || '';
  const cronSecret = Deno.env.get('CRON_SECRET') || '';
  const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPA_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPA_SERVICE_ROLE_KEY') ?? '';

  if (!isCron) {
    if (!authHeader || !supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Buscar configuração de retenção da tabela log_retention_config
    const { data: config, error: configError } = await adminClient
      .from('log_retention_config')
      .select('action_logs_retention_days, access_logs_retention_days')
      .eq('id', 1)
      .single();

    if (configError || !config) {
      console.warn(`[WARN] Erro ao buscar configuração, usando valores padrão (180 dias):`, configError);
      // Usar valores padrão se não conseguir buscar a configuração
      config = {
        action_logs_retention_days: 180,
        access_logs_retention_days: 180,
      };
    }

    const actionRetentionDays = config.action_logs_retention_days || 180;
    const accessRetentionDays = config.access_logs_retention_days || 180;

    // Calcular data limite para logs de ações
    const dataLimiteAction = new Date();
    dataLimiteAction.setDate(dataLimiteAction.getDate() - actionRetentionDays);
    const dataLimiteActionISO = dataLimiteAction.toISOString();

    // Calcular data limite para logs de acesso
    const dataLimiteAccess = new Date();
    dataLimiteAccess.setDate(dataLimiteAccess.getDate() - accessRetentionDays);
    const dataLimiteAccessISO = dataLimiteAccess.toISOString();

    console.log(`[INFO] Iniciando limpeza de logs:`);
    console.log(`[INFO] - Logs de ações: anteriores a ${dataLimiteActionISO} (${actionRetentionDays} dias)`);
    console.log(`[INFO] - Logs de acesso: anteriores a ${dataLimiteAccessISO} (${accessRetentionDays} dias)`);

    // 2. Limpar logs de ações (user_action_logs)
    const { data: deletedActionLogs, error: actionError } = await adminClient
      .from('user_action_logs')
      .delete()
      .lt('created_at', dataLimiteActionISO)
      .select('id', { count: 'exact', head: false });

    if (actionError) {
      console.error(`[ERROR] Erro ao deletar logs de ações:`, actionError);
      throw new Error(`Erro ao deletar logs de ações: ${actionError.message}`);
    }

    const deletedActionLogsCount = Array.isArray(deletedActionLogs) ? deletedActionLogs.length : 0;
    console.log(`[SUCCESS] ${deletedActionLogsCount} logs de ações deletados`);

    // 3. Limpar logs de acesso (user_access_logs)
    const { data: deletedAccessLogs, error: accessError } = await adminClient
      .from('user_access_logs')
      .delete()
      .lt('created_at', dataLimiteAccessISO)
      .select('id', { count: 'exact', head: false });

    if (accessError) {
      console.error(`[ERROR] Erro ao deletar logs de acesso:`, accessError);
      throw new Error(`Erro ao deletar logs de acesso: ${accessError.message}`);
    }

    const deletedAccessLogsCount = Array.isArray(deletedAccessLogs) ? deletedAccessLogs.length : 0;
    console.log(`[SUCCESS] ${deletedAccessLogsCount} logs de acesso deletados`);

    // 4. Atualizar configuração de retenção com a data da última limpeza
    const { error: updateError } = await adminClient
      .from('log_retention_config')
      .update({
        last_cleanup_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (updateError) {
      console.warn(`[WARN] Erro ao atualizar log_retention_config:`, updateError);
      // Não falha a operação se não conseguir atualizar a configuração
    }

    const resultado = {
      deleted_action_logs: deletedActionLogsCount,
      deleted_access_logs: deletedAccessLogsCount,
      action_retention_days: actionRetentionDays,
      access_retention_days: accessRetentionDays,
      data_limite_action: dataLimiteActionISO,
      data_limite_access: dataLimiteAccessISO,
      last_cleanup_at: new Date().toISOString(),
    };

    console.log(`[INFO] Limpeza concluída:`, resultado);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Limpeza concluída: ${deletedActionLogsCount} logs de ações e ${deletedAccessLogsCount} logs de acesso removidos.`,
        ...resultado,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ERROR] Erro na função cleanup-old-logs-v2:', error);
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

