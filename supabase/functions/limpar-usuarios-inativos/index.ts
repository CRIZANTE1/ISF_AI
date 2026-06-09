/**
 * Edge Function para limpar usuários inativos há 400+ dias
 * 
 * Esta função:
 * 1. Busca usuários com 400+ dias de inatividade (último login)
 * 2. Envia email de aviso informando que a conta será excluída em 7 dias
 * 
 * IMPORTANTE: 
 * - Esta função APENAS envia o email de aviso
 * - A exclusão real será feita após 7 dias por outro processo
 * - O usuário pode evitar a exclusão fazendo login nos próximos 7 dias
 * 
 * Uso:
 * POST /functions/v1/limpar-usuarios-inativos
 * (Pode ser chamada via cron job ou manualmente)
 * 
 * Configuração Cron (recomendado: mensal):
 * 0 10 1 * * (todo dia 1 do mês às 10h UTC)
 * 
 * NOTA: É necessário criar outra função/cron job para deletar usuários
 * que receberam o aviso há mais de 7 dias e não fizeram login.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações SMTP
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465');
const SMTP_USER = Deno.env.get('SMTP_USER') || '';
const SMTP_PASS = Deno.env.get('SMTP_PASS') || '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || '';

// Dias de inatividade para exclusão
const DIAS_INATIVIDADE = 400;

interface InactiveUser {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
  } | null;
}

/**
 * Envia email de aviso de exclusão por inatividade
 */
async function enviarEmailAvisoExclusao(user: InactiveUser, diasInativo: number): Promise<boolean> {
  if (!EMAIL_FROM || !SMTP_USER || !SMTP_PASS) {
    console.error('[ERROR] Configurações SMTP não encontradas');
    return false;
  }

  const userName = user.profile?.full_name || user.email.split('@')[0];
  const dataExclusao = new Date();
  dataExclusao.setDate(dataExclusao.getDate() + 7); // 7 dias para reagir

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de Exclusão de Conta - ISF IA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                ⚠️ Aviso de Exclusão de Conta
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${userName}</strong>,
              </p>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Identificamos que sua conta no <strong style="color: #00ff88;">ISF IA</strong> está inativa há <strong style="color: #ff4444;">${diasInativo} dias</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, rgba(255,68,68,0.1) 0%, rgba(255,68,68,0.05) 100%); border-left: 4px solid #ff4444; padding: 20px; margin: 30px 0; border-radius: 10px;">
                <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                  <strong style="color: #ff4444;">⚠️ ATENÇÃO:</strong>
                </p>
                <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 0;">
                  Conforme nossa política de privacidade e LGPD, contas inativas por mais de <strong>400 dias</strong> serão <strong>permanentemente excluídas</strong> para proteger seus dados pessoais.
                </p>
              </div>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                <strong style="color: #00ff88;">O que acontecerá:</strong>
              </p>
              <ul style="color: #cccccc; font-size: 15px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                <li>Todos os seus dados serão <strong style="color: #ff4444;">permanentemente deletados</strong></li>
                <li>Equipamentos, inspeções e histórico serão removidos</li>
                <li>Sua conta de autenticação será excluída</li>
                <li>Esta ação é <strong style="color: #ff4444;">IRREVERSÍVEL</strong></li>
              </ul>
              
              <div style="background: linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0.05) 100%); border-left: 4px solid #00ff88; padding: 20px; margin: 30px 0; border-radius: 10px;">
                <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                  <strong style="color: #00ff88;">💡 Como evitar a exclusão:</strong>
                </p>
                <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 0;">
                  Faça login no aplicativo <strong>ISF IA</strong> nos próximos <strong>7 dias</strong> para manter sua conta ativa. Qualquer atividade no app será suficiente para evitar a exclusão.
                </p>
              </div>
              
              <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 30px 0 0 0;">
                Se você não deseja mais usar o ISF IA, não é necessário fazer nada. Sua conta será excluída automaticamente após o prazo.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333;">
              <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                Este é um email automático do sistema ISF IA.
              </p>
              <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0;">
                Se você não deseja receber mais emails, sua conta será excluída automaticamente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  let conn: Deno.Conn | Deno.TlsConn | null = null;

  try {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emailDomain = EMAIL_FROM.includes('@') ? EMAIL_FROM.split('@')[1] : 'isfia.local';
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${emailDomain}>`;
    
    const emailBody = [
      `From: ${EMAIL_FROM}`,
      `To: ${user.email}`,
      `Subject: ⚠️ Aviso: Sua conta ISF IA será excluída em 7 dias`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${boundary}--`
    ].join('\r\n');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT });
    
    const readResponse = async (): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida');
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    };

    const sendCommand = async (command: string): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida');
      await conn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    };

    await readResponse(); // Greeting
    await sendCommand(`EHLO ${SMTP_HOST}`);
    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(SMTP_USER));
    await sendCommand(btoa(SMTP_PASS));
    await sendCommand(`MAIL FROM:<${EMAIL_FROM}>`);
    await sendCommand(`RCPT TO:<${user.email}>`);
    await sendCommand('DATA');
    
    if (!conn) throw new Error('Conexão não estabelecida');
    await conn.write(encoder.encode(emailBody + '\r\n.\r\n'));
    await readResponse();
    await sendCommand('QUIT');
    
    if (conn) conn.close();
    
    console.log(`[SUCCESS] Email de aviso enviado para ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Erro ao enviar email para ${user.email}:`, error);
    if (conn) {
      try { conn.close(); } catch (e) {}
    }
    return false;
  }
}

/**
 * Deleta todos os dados do usuário e a conta de autenticação
 * 
 * NOTA: Esta função não é mais usada nesta Edge Function.
 * Ela será usada por outra função que deleta usuários após 7 dias do aviso.
 * Mantida aqui para referência futura.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Calcular data limite (400 dias atrás)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - DIAS_INATIVIDADE);
    const dataLimiteISO = dataLimite.toISOString();

    console.log(`[INFO] Buscando usuários inativos desde ${dataLimiteISO}`);

    // Buscar usuários inativos (último login há mais de 400 dias)
    // Usuários que nunca fizeram login também são considerados inativos
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Erro ao listar usuários: ${authError.message}`);
    }

    const usuariosInativos: InactiveUser[] = [];

    for (const authUser of authUsers.users) {
      const lastSignIn = authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null;
      const createdAt = new Date(authUser.created_at);
      
      // Considerar inativo se:
      // 1. Nunca fez login E conta criada há mais de 400 dias
      // 2. Último login há mais de 400 dias
      const diasInativo = lastSignIn 
        ? Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (diasInativo >= DIAS_INATIVIDADE) {
        // Buscar perfil
        const { data: profile } = await adminClient
          .from('profiles')
          .select('full_name')
          .eq('id', authUser.id)
          .single();

        usuariosInativos.push({
          id: authUser.id,
          email: authUser.email || '',
          last_sign_in_at: authUser.last_sign_in_at,
          created_at: authUser.created_at,
          profile: profile || null,
        });
      }
    }

    console.log(`[INFO] Encontrados ${usuariosInativos.length} usuários inativos`);

    const resultados = {
      total: usuariosInativos.length,
      emailsEnviados: 0,
      emailsFalhados: 0,
      usuariosMarcadosParaExclusao: 0,
      detalhes: [] as Array<{
        userId: string;
        email: string;
        diasInativo: number;
        emailEnviado: boolean;
        erro?: string;
      }>,
    };

    // Processar cada usuário inativo
    for (const user of usuariosInativos) {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
      const createdAt = new Date(user.created_at);
      const diasInativo = lastSignIn 
        ? Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const detalhe: typeof resultados.detalhes[0] = {
        userId: user.id,
        email: user.email,
        diasInativo,
        emailEnviado: false,
      };

      try {
        // 1. Enviar email de aviso (exclusão será feita após 7 dias por outro processo)
        const emailEnviado = await enviarEmailAvisoExclusao(user, diasInativo);
        detalhe.emailEnviado = emailEnviado;

        if (emailEnviado) {
          resultados.emailsEnviados++;
          resultados.usuariosMarcadosParaExclusao++;
          
          // Registrar email em email_logs para rastreamento
          try {
            await adminClient.from('email_logs').insert({
              user_id: user.id,
              email_type: 'aviso_exclusao_inatividade',
              email_address: user.email,
              status: 'sent',
              details: { diasInativo, dataAviso: new Date().toISOString() }
            });
          } catch (logError) {
            console.warn(`[WARN] Erro ao registrar email em email_logs para ${user.email}:`, logError);
          }
          
          console.log(`[SUCCESS] Email de aviso enviado para ${user.email}. Usuário será deletado após 7 dias se não fizer login.`);
        } else {
          resultados.emailsFalhados++;
          detalhe.erro = 'Falha ao enviar email';
        }

        // NOTA: A exclusão real do usuário será feita após 7 dias por outro processo/cron job
        // Este processo apenas envia o aviso. O usuário tem 7 dias para fazer login e evitar a exclusão.
      } catch (error) {
        resultados.emailsFalhados++;
        detalhe.erro = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[ERROR] Erro ao processar usuário ${user.email}:`, error);
      }

      resultados.detalhes.push(detalhe);
    }

    console.log(`[INFO] Processamento concluído:`, resultados);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído: ${resultados.emailsEnviados} emails de aviso enviados. Usuários serão deletados após 7 dias se não fizerem login.`,
        resultados,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ERROR] Erro na função limpar-usuarios-inativos:', error);
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

