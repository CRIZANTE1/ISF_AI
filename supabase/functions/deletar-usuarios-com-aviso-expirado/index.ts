/**
 * Edge Function para deletar usuários que receberam aviso de exclusão há 7+ dias
 * 
 * Esta função:
 * 1. Busca usuários que receberam email de aviso há mais de 7 dias
 * 2. Verifica se o usuário fez login após o aviso (se fez, não deleta)
 * 3. Deleta TODOS os dados do usuário e a conta de autenticação
 * 
 * IMPORTANTE: Esta operação é IRREVERSÍVEL
 * 
 * Uso:
 * POST /functions/v1/deletar-usuarios-com-aviso-expirado
 * (Pode ser chamada via cron job ou manualmente)
 * 
 * Configuração Cron (recomendado: diário):
 * 0 11 * * * (todo dia às 11h UTC)
 * 
 * Esta função complementa limpar-usuarios-inativos:
 * - limpar-usuarios-inativos: Envia aviso para usuários inativos há 400+ dias
 * - deletar-usuarios-com-aviso-expirado: Deleta usuários que receberam aviso há 7+ dias
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dias após o aviso para executar a exclusão
const DIAS_APOS_AVISO = 7;

interface UserWithWarning {
  userId: string;
  email: string;
  avisoEnviadoEm: string;
  lastSignInAt: string | null;
  createdAt: string;
}

/**
 * Deleta todos os dados do usuário e a conta de autenticação
 */
async function deletarUsuarioCompleto(adminClient: any, userId: string): Promise<boolean> {
  const tables = [
    'extintores', 'mangueiras', 'conjuntos_autonomos', 'inventario_multigas',
    'inventario_camaras_espuma', 'inventario_canhoes_monitores', 'inventario_chuveiros_lava_olhos',
    'inventario_alarmes', 'abrigos', 'custom_equipment', 'equipment',
    'inspecoes_scba', 'inspecoes_multigas', 'inspecoes_camaras_espuma',
    'inspecoes_canhoes_monitores', 'inspecoes_chuveiros_lava_olhos', 'inspecoes_alarmes',
    'inspecoes_abrigos', 'inspecoes_mangueiras', 'custom_equipment_inspections', 'inspections',
    'log_acoes_extintores', 'log_acoes_scba', 'log_acoes_multigas',
    'log_acoes_camaras_espuma', 'log_acoes_canhoes_monitores', 'log_acoes_chuveiros_lava_olhos',
    'log_acoes_alarmes', 'log_acoes_abrigos', 'log_baixa_extintores',
    'user_action_logs', 'user_access_logs', 'email_logs',
    'purchases',
  ];

  // Deletar dados de todas as tabelas
  const deletePromises = tables.map(async (table) => {
    try {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error && error.code !== '42P01' && error.code !== '42703') {
        console.warn(`[WARN] Erro ao deletar dados da tabela ${table}:`, error.message);
      }
    } catch (err) {
      console.warn(`[WARN] Erro ao processar tabela ${table}:`, err);
    }
  });

  await Promise.all(deletePromises);

  // Deletar perfil
  const { error: profileError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.warn(`[WARN] Erro ao deletar perfil:`, profileError.message);
  }

  // Deletar conta de autenticação
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error(`[ERROR] Erro ao deletar usuário ${userId}:`, deleteError);
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get('CRON_SECRET') || '';
  const auth = req.headers.get('Authorization') || '';
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPA_URL') ?? '';
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Calcular data limite (7 dias atrás)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - DIAS_APOS_AVISO);
    const dataLimiteISO = dataLimite.toISOString();

    console.log(`[INFO] Buscando usuários com aviso enviado antes de ${dataLimiteISO}`);

    // Buscar emails de aviso enviados há mais de 7 dias
    const { data: emailsAviso, error: emailError } = await adminClient
      .from('email_logs')
      .select('user_id, email_address, sent_at')
      .eq('email_type', 'aviso_exclusao_inatividade')
      .eq('status', 'sent')
      .lt('sent_at', dataLimiteISO)
      .order('sent_at', { ascending: true });

    if (emailError) {
      throw new Error(`Erro ao buscar emails de aviso: ${emailError.message}`);
    }

    if (!emailsAviso || emailsAviso.length === 0) {
      console.log('[INFO] Nenhum usuário encontrado com aviso expirado');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum usuário encontrado para exclusão.',
          resultados: {
            total: 0,
            usuariosDeletados: 0,
            usuariosMantidos: 0,
            detalhes: [],
          },
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[INFO] Encontrados ${emailsAviso.length} usuários com aviso expirado`);

    const usuariosParaDeletar: UserWithWarning[] = [];

    // Verificar cada usuário que recebeu aviso
    for (const emailLog of emailsAviso) {
      if (!emailLog.user_id) continue;

      // Buscar dados do usuário
      const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(emailLog.user_id);

      if (authError || !authUser.user) {
        console.warn(`[WARN] Usuário ${emailLog.user_id} não encontrado no auth`);
        continue;
      }

      const avisoEnviadoEm = new Date(emailLog.sent_at);
      const lastSignIn = authUser.user.last_sign_in_at ? new Date(authUser.user.last_sign_in_at) : null;

      // Verificar se o usuário fez login APÓS receber o aviso
      // Se fez login após o aviso, não deleta (usuário reagiu)
      if (lastSignIn && lastSignIn > avisoEnviadoEm) {
        console.log(`[INFO] Usuário ${authUser.user.email} fez login após o aviso. Mantendo conta.`);
        continue;
      }

      // Usuário não fez login após o aviso - marcar para exclusão
      usuariosParaDeletar.push({
        userId: emailLog.user_id,
        email: authUser.user.email || emailLog.email_address || '',
        avisoEnviadoEm: emailLog.sent_at,
        lastSignInAt: authUser.user.last_sign_in_at,
        createdAt: authUser.user.created_at,
      });
    }

    console.log(`[INFO] ${usuariosParaDeletar.length} usuários serão deletados (não fizeram login após o aviso)`);

    const resultados = {
      total: usuariosParaDeletar.length,
      usuariosDeletados: 0,
      usuariosFalhados: 0,
      detalhes: [] as Array<{
        userId: string;
        email: string;
        avisoEnviadoEm: string;
        deletado: boolean;
        erro?: string;
      }>,
    };

    // Deletar cada usuário
    for (const user of usuariosParaDeletar) {
      const detalhe: typeof resultados.detalhes[0] = {
        userId: user.userId,
        email: user.email,
        avisoEnviadoEm: user.avisoEnviadoEm,
        deletado: false,
      };

      try {
        const deletado = await deletarUsuarioCompleto(adminClient, user.userId);
        detalhe.deletado = deletado;

        if (deletado) {
          resultados.usuariosDeletados++;
          console.log(`[SUCCESS] Usuário ${user.email} deletado com sucesso`);
        } else {
          resultados.usuariosFalhados++;
          detalhe.erro = 'Falha ao deletar';
        }
      } catch (error) {
        resultados.usuariosFalhados++;
        detalhe.erro = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[ERROR] Erro ao deletar usuário ${user.email}:`, error);
      }

      resultados.detalhes.push(detalhe);
    }

    console.log(`[INFO] Processamento concluído:`, resultados);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído: ${resultados.usuariosDeletados} usuários deletados`,
        resultados,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ERROR] Erro na função deletar-usuarios-com-aviso-expirado:', error);
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

