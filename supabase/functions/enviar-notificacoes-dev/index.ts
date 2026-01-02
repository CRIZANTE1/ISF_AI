import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || ''
const DEV_EMAIL = Deno.env.get('DEV_EMAIL') || ''

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    if (!DEV_EMAIL) {
      return new Response(
        JSON.stringify({ success: false, error: 'DEV_EMAIL não configurado' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPA_URL') || Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPA_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPA_URL/SUPABASE_URL e SUPA_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(hoje.getDate() - 1)
    const umMesAtras = new Date(hoje)
    umMesAtras.setMonth(hoje.getMonth() - 1)

    // Buscar novos feedbacks (últimas 24h)
    const { data: novosFeedbacks24h, error: feedbackError24h } = await supabase
      .from('user_feedback')
      .select('*, profiles(full_name)')
      .gte('created_at', ontem.toISOString())
      .order('created_at', { ascending: false })

    // Buscar feedbacks do último mês
    const { data: novosFeedbacksMes, error: feedbackErrorMes } = await supabase
      .from('user_feedback')
      .select('*, profiles(full_name)')
      .gte('created_at', umMesAtras.toISOString())
      .order('created_at', { ascending: false })

    if (feedbackError24h) {
      console.warn(`[WARN] Erro ao buscar feedbacks 24h:`, feedbackError24h.message)
    }
    if (feedbackErrorMes) {
      console.warn(`[WARN] Erro ao buscar feedbacks mês:`, feedbackErrorMes.message)
    }

    // Buscar novos usuários de auth.users (últimas 24h)
    // A tabela profiles não tem created_at, então precisamos buscar de auth.users
    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers()

    if (authUsersError) {
      console.warn(`[WARN] Erro ao listar usuários:`, authUsersError.message)
    }

    const usuariosComEmail = []
    const ontemISO = ontem.toISOString()

    // Filtrar usuários criados nas últimas 24h
    const novosAuthUsers24h = authUsersData?.users?.filter(user => {
      const userCreatedAt = new Date(user.created_at)
      return userCreatedAt >= ontem
    }) || []

    // Filtrar usuários criados no último mês
    const novosAuthUsersMes = authUsersData?.users?.filter(user => {
      const userCreatedAt = new Date(user.created_at)
      return userCreatedAt >= umMesAtras
    }) || []

    console.log(`[INFO] Encontrados ${novosAuthUsers24h.length} novos usuários nas últimas 24h e ${novosAuthUsersMes.length} no último mês`)

    // Para cada novo usuário do último mês, buscar perfil e email
    for (const authUser of novosAuthUsersMes) {
      try {
        // Buscar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, plan')
          .eq('id', authUser.id)
          .single()

        if (profile && authUser.email) {
          usuariosComEmail.push({
            id: authUser.id,
            full_name: profile.full_name,
            plan: profile.plan || 'trial',
            email: authUser.email,
            created_at: authUser.created_at, // Usar created_at de auth.users
          })
        }
      } catch (err) {
        console.warn(`[WARN] Erro ao buscar perfil do usuário ${authUser.id}:`, err)
        // Se não tiver perfil, ainda assim incluir o usuário com dados básicos
        if (authUser.email) {
          usuariosComEmail.push({
            id: authUser.id,
            full_name: null,
            plan: 'trial',
            email: authUser.email,
            created_at: authUser.created_at,
          })
        }
      }
    }

    const feedbacksPorTipo = {
      feedback: novosFeedbacksMes?.filter(f => f.type === 'feedback') || [],
      suggestion: novosFeedbacksMes?.filter(f => f.type === 'suggestion') || []
    }

    const feedbacks24hPorTipo = {
      feedback: novosFeedbacks24h?.filter(f => f.type === 'feedback') || [],
      suggestion: novosFeedbacks24h?.filter(f => f.type === 'suggestion') || []
    }

    const stats = {
      novos_usuarios_24h: novosAuthUsers24h.length,
      novos_usuarios_mes: usuariosComEmail.length,
      novos_feedbacks_24h: novosFeedbacks24h?.length || 0,
      novos_feedbacks_mes: novosFeedbacksMes?.length || 0,
      feedbacks_por_tipo: {
        feedback: feedbacksPorTipo.feedback.length,
        suggestion: feedbacksPorTipo.suggestion.length
      },
      feedbacks_24h_por_tipo: {
        feedback: feedbacks24hPorTipo.feedback.length,
        suggestion: feedbacks24hPorTipo.suggestion.length
      },
      usuarios_por_plano: {
        trial: usuariosComEmail.filter(u => u.plan === 'trial').length,
        premium: usuariosComEmail.filter(u => u.plan === 'premium').length
      }
    }

    console.log(`[INFO] Estatísticas - 24h: ${stats.novos_usuarios_24h} usuários, ${stats.novos_feedbacks_24h} feedbacks | Mês: ${stats.novos_usuarios_mes} usuários, ${stats.novos_feedbacks_mes} feedbacks`)

    const html = gerarHTMLDashboard(stats, novosFeedbacksMes || [], usuariosComEmail)
    const emailEnviado = await enviarEmailSMTP(html, DEV_EMAIL)

    return new Response(
      JSON.stringify({
        success: emailEnviado,
        message: emailEnviado ? 'Notificações enviadas para dev' : 'Erro ao enviar email',
        stats: stats
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: emailEnviado ? 200 : 500,
      }
    )
  } catch (error) {
    console.error('[ERROR] Erro ao processar notificações dev:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro desconhecido' }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500 }
    )
  }
})

function formatarData(data: string): string {
  if (!data) return '-'
  try {
    const dt = new Date(data)
    return dt.toLocaleString('pt-BR')
  } catch {
    return data
  }
}

function gerarCardGlassmorphism(valor: string, label: string, cor: string = '#fff', icon: string = ''): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${cor}30, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">${label}</td>${icon ? `<td align="right" style="font-size: 24px;">${icon}</td>` : '<td></td>'}</tr><tr><td colspan="2" style="color: ${cor}; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px ${cor}50;">${valor}</td></tr></table></td></tr></table>`
}

function gerarProgressBarTable(percentual: number, cor: string): string {
  const largura = Math.max(5, Math.min(100, percentual))
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td style="background-color: rgba(255,255,255,0.1); height: 12px; padding: 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td width="${largura}%" style="background-color: ${cor}; height: 12px; padding: 0;"></td><td width="${100 - largura}%" style="padding: 0;"></td></tr></table></td></tr></table>`
}

function gerarHTMLDashboard(stats: any, feedbacks: any[], usuarios: any[]): string {
  const dataGeracao = new Date().toLocaleString('pt-BR')
  const dataFormatada = new Date().toLocaleDateString('pt-BR')
  
  const totalUsuarios24h = stats.novos_usuarios_24h || 0
  const totalUsuariosMes = stats.novos_usuarios_mes || 0
  const totalFeedbacks24h = stats.novos_feedbacks_24h || 0
  const totalFeedbacksMes = stats.novos_feedbacks_mes || 0
  const percentualTrial = totalUsuariosMes > 0 ? (stats.usuarios_por_plano.trial / totalUsuariosMes * 100) : 0
  const percentualPremium = totalUsuariosMes > 0 ? (stats.usuarios_por_plano.premium / totalUsuariosMes * 100) : 0
  const percentualFeedback = totalFeedbacksMes > 0 ? (stats.feedbacks_por_tipo.feedback / totalFeedbacksMes * 100) : 0

  // Card 1: Novos Usuários
  const card1 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #007AFF30, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Novos Usuários</td><td align="right" style="font-size: 24px;">👥</td></tr><tr><td colspan="2" style="color: #fff; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px rgba(255,255,255,0.5);">${totalUsuariosMes}</td></tr><tr><td colspan="2" style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Último mês</td></tr><tr><td colspan="2" style="color: rgba(255,255,255,0.5); font-size: 12px; padding-bottom: 20px;">24h: ${totalUsuarios24h}</td></tr><tr><td colspan="2"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-bottom: 8px;">Trial</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.usuarios_por_plano.trial}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualTrial, '#007AFF')}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-top: 12px; padding-bottom: 8px;">Premium</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.usuarios_por_plano.premium}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualPremium, '#FFCC00')}</td></tr></table></td></tr></table></td></tr></table>`

  // Card 2: Novos Feedbacks
  const card2 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #53D76930, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Novos Feedbacks</td><td align="right" style="font-size: 24px;">💬</td></tr><tr><td colspan="2" style="color: #fff; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px rgba(255,255,255,0.5);">${totalFeedbacksMes}</td></tr><tr><td colspan="2" style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 10px;">Último mês</td></tr><tr><td colspan="2" style="color: rgba(255,255,255,0.5); font-size: 12px; padding-bottom: 20px;">24h: ${totalFeedbacks24h}</td></tr><tr><td colspan="2" align="center" style="padding: 20px 0;"><div style="display: inline-block; background: linear-gradient(135deg, rgba(83,215,105,0.2) 0%, rgba(83,215,105,0.1) 100%); border: 8px solid ${percentualFeedback > 0 ? '#53D769' : 'rgba(255,255,255,0.1)'}; border-radius: 50%; width: 84px; height: 84px; line-height: 84px; color: #fff; font-size: 32px; font-weight: bold; text-align: center; box-shadow: 0 0 20px ${percentualFeedback > 0 ? 'rgba(83,215,105,0.5)' : 'rgba(255,255,255,0.1)'}, inset 0 1px 0 rgba(255,255,255,0.1);">${Math.round(percentualFeedback)}%</div></td></tr><tr><td colspan="2"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 16px;"><tr><td style="color: rgba(255,255,255,0.7); font-size: 13px;">Feedbacks</td><td align="right" style="color: #fff; font-size: 18px; font-weight: 600;">${stats.feedbacks_por_tipo.feedback}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 13px; padding-top: 16px;">Sugestões</td><td align="right" style="color: #fff; font-size: 18px; font-weight: 600; padding-top: 16px;">${stats.feedbacks_por_tipo.suggestion}</td></tr></table></td></tr></table></td></tr></table>`

  // Card 3: Distribuição
  const card3 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #FFCC0030, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Distribuição</td><td align="right" style="font-size: 24px;">📈</td></tr><tr><td colspan="2" align="center" style="padding: 20px 0;"><div style="display: inline-block; background: linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,122,255,0.1) 100%); border: 8px solid ${percentualTrial > 0 ? '#007AFF' : 'rgba(255,255,255,0.1)'}; border-radius: 50%; width: 84px; height: 84px; line-height: 84px; color: #fff; font-size: 32px; font-weight: bold; text-align: center; box-shadow: 0 0 20px ${percentualTrial > 0 ? 'rgba(0,122,255,0.5)' : 'rgba(255,255,255,0.1)'}, inset 0 1px 0 rgba(255,255,255,0.1);">${Math.round(percentualTrial)}%</div></td></tr><tr><td colspan="2" align="center" style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 20px;">Usuários Trial</td></tr><tr><td colspan="2" align="center" style="padding: 20px 0;"><div style="display: inline-block; background: linear-gradient(135deg, rgba(255,204,0,0.2) 0%, rgba(255,204,0,0.1) 100%); border: 8px solid ${percentualPremium > 0 ? '#FFCC00' : 'rgba(255,255,255,0.1)'}; border-radius: 50%; width: 84px; height: 84px; line-height: 84px; color: #fff; font-size: 32px; font-weight: bold; text-align: center; box-shadow: 0 0 20px ${percentualPremium > 0 ? 'rgba(255,204,0,0.5)' : 'rgba(255,255,255,0.1)'}, inset 0 1px 0 rgba(255,255,255,0.1);">${Math.round(percentualPremium)}%</div></td></tr><tr><td colspan="2" align="center" style="color: rgba(255,255,255,0.6); font-size: 14px;">Usuários Premium</td></tr></table></td></tr></table>`

  let htmlUsuarios = ''
  if (usuarios.length > 0) {
    htmlUsuarios = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 20px; font-weight: 600; padding-bottom: 20px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">👥 Novos Usuários</td></tr>`
    for (const user of usuarios.slice(0, 10)) {
      const planoBadge = user.plan === 'premium' ? '<span style="background-color: #FFCC00; color: #000; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; box-shadow: 0 0 10px rgba(255,204,0,0.4);">PREMIUM</span>' : '<span style="background-color: #007AFF; color: #fff; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; box-shadow: 0 0 10px rgba(0,122,255,0.4);">TRIAL</span>'
      htmlUsuarios += `<tr><td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><table cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 16px; font-weight: 600; padding-bottom: 6px;">${(user.full_name || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr><tr><td style="color: rgba(255,255,255,0.6); font-size: 13px;">${(user.email || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr></table></td><td align="right" valign="top"><table cellpadding="0" cellspacing="0" border="0" align="right"><tr><td align="right" style="padding-bottom: 8px;">${planoBadge}</td></tr><tr><td align="right" style="color: rgba(255,255,255,0.5); font-size: 12px;">${formatarData(user.created_at)}</td></tr></table></td></tr></table></td></tr>`
    }
    if (usuarios.length > 10) {
      htmlUsuarios += `<tr><td style="text-align: center; padding: 16px; color: rgba(255,255,255,0.5); font-size: 14px; font-style: italic;">+ ${usuarios.length - 10} usuários adicionais</td></tr>`
    }
    htmlUsuarios += `</table></td></tr></table>`
  } else {
    htmlUsuarios = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 40px; text-align: center; color: #8E8E93; font-size: 16px;">Nenhum novo usuário no último mês</td></tr></table>`
  }

  let htmlFeedbacks = ''
  if (feedbacks.length > 0) {
    htmlFeedbacks = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 20px; font-weight: 600; padding-bottom: 20px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">💬 Novos Feedbacks</td></tr>`
    for (const fb of feedbacks.slice(0, 10)) {
      const tipoBadge = fb.type === 'feedback' ? '<span style="background-color: #53D769; color: #000; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; box-shadow: 0 0 10px rgba(83,215,105,0.4);">FEEDBACK</span>' : '<span style="background-color: #FF9500; color: #fff; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; box-shadow: 0 0 10px rgba(255,149,0,0.4);">SUGESTÃO</span>'
      const userName = fb.profiles?.full_name || fb.user_id?.substring(0, 8) || '-'
      const mensagem = (fb.message || '-').substring(0, 80).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      htmlFeedbacks += `<tr><td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><table cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 16px; font-weight: 600; padding-bottom: 6px;">${mensagem}</td></tr><tr><td style="color: rgba(255,255,255,0.6); font-size: 13px;">Por: ${userName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr></table></td><td align="right" valign="top"><table cellpadding="0" cellspacing="0" border="0" align="right"><tr><td align="right" style="padding-bottom: 8px;">${tipoBadge}</td></tr><tr><td align="right" style="color: rgba(255,255,255,0.5); font-size: 12px;">${formatarData(fb.created_at)}</td></tr></table></td></tr></table></td></tr>`
    }
    if (feedbacks.length > 10) {
      htmlFeedbacks += `<tr><td style="text-align: center; padding: 16px; color: rgba(255,255,255,0.5); font-size: 14px; font-style: italic;">+ ${feedbacks.length - 10} feedbacks adicionais</td></tr>`
    }
    htmlFeedbacks += `</table></td></tr></table>`
  } else {
    htmlFeedbacks = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 40px; text-align: center; color: #8E8E93; font-size: 16px;">Nenhum novo feedback no último mês</td></tr></table>`
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard Dev - ${dataFormatada}</title></head><body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; max-width: 1400px; margin: 0 auto;"><tr><td style="padding: 40px; background: linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,81,213,0.15) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(0,122,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 42px; font-weight: 700; padding-bottom: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.3);">📊 Dashboard ISF IA</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 18px;">Resumo Diário - ${dataFormatada}</td></tr></table></td></tr><tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="33.33%" style="padding-right: 15px; vertical-align: top;">${card1}</td><td width="33.33%" style="padding: 0 15px; vertical-align: top;">${card2}</td><td width="33.33%" style="padding-left: 15px; vertical-align: top;">${card3}</td></tr></table></td></tr><tr><td>${htmlUsuarios}</td></tr><tr><td>${htmlFeedbacks}</td></tr><tr><td style="padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 12px; text-align: center;"><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p><p>Relatório gerado em ${dataGeracao}</p></td></tr></table></body></html>`
}

async function enviarEmailSMTP(html: string, devEmail: string): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[ERROR] SMTP_USER e SMTP_PASS devem estar configurados')
    return false
  }

  if (!EMAIL_FROM) {
    console.error('[ERROR] EMAIL_FROM deve estar configurado')
    return false
  }

  let conn: Deno.Conn | Deno.TlsConn | null = null

  try {
    const dataFormatadaBR = new Date().toLocaleDateString('pt-BR')
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const emailDomain = EMAIL_FROM.includes('@') ? EMAIL_FROM.split('@')[1] : 'isfia.local'
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${emailDomain}>`
    
    const emailBody = [
      `From: ${EMAIL_FROM}`,
      `To: ${devEmail}`,
      `Subject: 📊 Dashboard ISF IA - ${dataFormatadaBR} - Novos Usuários e Feedbacks`,
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
    ].join('\r\n')

    console.log(`[INFO] Conectando ao servidor SMTP: ${SMTP_HOST}:${SMTP_PORT}`)
    
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    if (SMTP_PORT === 465) {
      conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT })
      console.log(`[DEBUG] Conexão TLS direta estabelecida (porta 465)`)
    } else {
      conn = await Deno.connect({ hostname: SMTP_HOST, port: SMTP_PORT })
    }
    
    const readResponse = async (): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida')
      const buffer = new Uint8Array(4096)
      const n = await conn.read(buffer)
      if (n === null) return ''
      return decoder.decode(buffer.subarray(0, n))
    }

    const sendCommand = async (command: string): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida')
      await conn.write(encoder.encode(command + '\r\n'))
      return await readResponse()
    }

    const greeting = await readResponse()
    console.log(`[DEBUG] SMTP Greeting: ${greeting}`)
    
    if (!greeting.startsWith('220')) {
      throw new Error(`SMTP handshake failed: ${greeting}`)
    }

    const ehlo = await sendCommand(`EHLO ${SMTP_HOST}`)
    console.log(`[DEBUG] SMTP EHLO: ${ehlo}`)
    
    if (!ehlo.includes('250')) {
      throw new Error(`SMTP EHLO failed: ${ehlo}`)
    }

    if (SMTP_PORT === 587 && !(conn instanceof Deno.TlsConn)) {
      const starttls = await sendCommand('STARTTLS')
      if (!starttls.includes('220')) {
        throw new Error(`SMTP STARTTLS failed: ${starttls}`)
      }
      try {
        if (!conn) throw new Error('Conexão não estabelecida')
        conn = await Deno.startTls(conn, { hostname: SMTP_HOST })
        const greeting2 = await readResponse()
        const ehlo2 = await sendCommand(`EHLO ${SMTP_HOST}`)
        if (!ehlo2.includes('250')) {
          throw new Error(`SMTP EHLO after TLS failed: ${ehlo2}`)
        }
      } catch (tlsError) {
        throw new Error(`Erro com STARTTLS. Use porta 465. Erro: ${tlsError.message}`)
      }
    }

    const authUser = await sendCommand('AUTH LOGIN')
    if (!authUser.includes('334')) {
      throw new Error(`SMTP AUTH LOGIN failed: ${authUser}`)
    }

    const userB64 = btoa(SMTP_USER)
    const authUserResp = await sendCommand(userB64)
    if (!authUserResp.includes('334')) {
      throw new Error(`SMTP User failed: ${authUserResp}`)
    }

    const passB64 = btoa(SMTP_PASS)
    const authPassResp = await sendCommand(passB64)
    if (!authPassResp.includes('235')) {
      throw new Error(`SMTP Authentication failed: ${authPassResp}`)
    }

    const mailFrom = await sendCommand(`MAIL FROM:<${EMAIL_FROM}>`)
    if (!mailFrom.includes('250')) {
      throw new Error(`SMTP MAIL FROM failed: ${mailFrom}`)
    }

    const rcptTo = await sendCommand(`RCPT TO:<${devEmail}>`)
    if (!rcptTo.includes('250')) {
      throw new Error(`SMTP RCPT TO failed for ${devEmail}: ${rcptTo}`)
    }

    const dataCmd = await sendCommand('DATA')
    if (!dataCmd.includes('354')) {
      throw new Error(`SMTP DATA failed: ${dataCmd}`)
    }

    if (!conn) throw new Error('Conexão não estabelecida')
    await conn.write(encoder.encode(emailBody + '\r\n.\r\n'))
    const dataResp = await readResponse()
    if (!dataResp.includes('250')) {
      throw new Error(`SMTP DATA send failed: ${dataResp}`)
    }

    await sendCommand('QUIT')
    if (conn) conn.close()

    console.log('[SUCCESS] Email enviado com sucesso via SMTP!')
    return true
  } catch (error) {
    console.error('[ERROR] Erro ao enviar email via SMTP:', error)
    if (conn) {
      try { conn.close() } catch (e) {}
    }
    return false
  }
}

