import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || ''
const DEV_EMAIL = Deno.env.get('DEV_EMAIL') || ''

interface InspectionRecord {
  id: number | string
  data_inspecao?: string
  data_servico?: string
  data_teste?: string
  status_geral?: string | null
  status?: string | null
  observacoes_gerais?: string | null
  observacoes?: string | null
  plano_de_acao?: string | null
  equipment_id?: string | null
  equipment_type?: string | null
  numero_identificacao?: string | null
  id_equipamento?: string | null
  id_camara?: string | null
  id_sistema?: string | null
  id_abrigo?: string | null
  id_mangueira?: string | null
  numero_serie_equipamento?: string | null
}

interface Stats {
  total: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  comPlanoAcao: number
  taxaAprovacao?: number
}

interface UserStatsForDev {
  userId: string
  userName: string
  totalEquipamentos: number
  totalInspecoes: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  comPlanoAcao: number
}

// Mapeamento de tabelas para suas colunas de data
interface TableConfig {
  table: string
  dataColumn: string
  idColumn: string
}

const inspectionTableConfigs: TableConfig[] = [
  { table: 'inspecoes_extintores', dataColumn: 'data_servico', idColumn: 'numero_identificacao' },
  { table: 'inspecoes_chuveiros_lava_olhos', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
  { table: 'inspecoes_camaras_espuma', dataColumn: 'data_inspecao', idColumn: 'id_camara' },
  { table: 'inspecoes_alarmes', dataColumn: 'data_inspecao', idColumn: 'id_sistema' },
  { table: 'inspecoes_canhoes_monitores', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
  { table: 'inspecoes_scba', dataColumn: 'data_inspecao', idColumn: 'numero_serie_equipamento' },
  { table: 'inspecoes_multigas', dataColumn: 'data_teste', idColumn: 'id_equipamento' },
  { table: 'inspecoes_abrigos', dataColumn: 'data_inspecao', idColumn: 'id_abrigo' },
  { table: 'inspecoes_mangueiras', dataColumn: 'data_inspecao', idColumn: 'id_mangueira' },
  { table: 'custom_equipment_inspections', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
]

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

    const cronSecret = Deno.env.get('CRON_SECRET') || ''
    const authHeader = req.headers.get('Authorization') || ''
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
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
    const dataFormatada = ontem.toISOString().split('T')[0]

    console.log(`[INFO] Buscando inspeções de: ${dataFormatada}`)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) {
      throw new Error(`Erro ao buscar usuários: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum usuário encontrado',
          data: dataFormatada,
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 200,
        }
      )
    }

    const resultados = []
    let allInspectionsForDev: InspectionRecord[] = []
    const userStatsForDev: UserStatsForDev[] = []

    for (const profile of profiles) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
        
        if (authError || !authUser?.user?.email) {
          console.warn(`[WARN] Não foi possível obter email do usuário ${profile.id}`)
          continue
        }

        const userEmail = authUser.user.email
        const userName = profile.full_name || userEmail.split('@')[0]
        const userInspections: InspectionRecord[] = []

        // Buscar inspeções de cada tabela usando as colunas corretas
        for (const config of inspectionTableConfigs) {
          try {
            const { data, error } = await supabase
              .from(config.table)
              .select('*')
              .eq(config.dataColumn, dataFormatada)
              .eq('user_id', profile.id)
              .order(config.dataColumn, { ascending: false })

            if (error) {
              console.warn(`[WARN] Erro ao buscar ${config.table}:`, error.message)
              continue
            }

            if (data && data.length > 0) {
              userInspections.push(...data.map((item: any) => ({
                ...item,
                equipment_type: config.table.replace('inspecoes_', '').replace('_inspections', ''),
                equipment_id: item[config.idColumn] || item.id || '-',
              })))
            }
          } catch (err) {
            console.warn(`[WARN] Erro ao processar ${config.table}:`, err)
            continue
          }
        }

        // Se não houver inspeções, pular este usuário
        if (userInspections.length === 0) {
          console.log(`[INFO] Usuário ${profile.id} não tem inspeções em ${dataFormatada} - pulando relatório`)
          continue
        }

        allInspectionsForDev.push(...userInspections)

        // Coletar estatísticas de equipamentos do usuário
        let totalEquipamentos = 0
        const equipmentTables = [
          'extintores', 'inventario_chuveiros_lava_olhos', 'inventario_camaras_espuma',
          'inventario_alarmes', 'inventario_canhoes_monitores', 'conjuntos_autonomos',
          'inventario_multigas', 'mangueiras', 'abrigos', 'custom_equipment'
        ]
        for (const table of equipmentTables) {
          try {
            const { count } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)
            if (count) totalEquipamentos += count
          } catch (err) {
            // Ignorar erros
          }
        }

        const userStats: Stats = {
          total: userInspections.length,
          aprovadas: userInspections.filter(i => {
            const status = i.status_geral || i.status || i.resultado_teste
            return status && (status.toLowerCase() === 'aprovado' || status.toLowerCase() === 'ok')
          }).length,
          reprovadas: userInspections.filter(i => {
            const status = i.status_geral || i.status || i.resultado_teste
            return status && (status.toLowerCase() === 'reprovado' || status.toLowerCase() === 'nao_conforme')
          }).length,
          pendentes: userInspections.filter(i => {
            const status = i.status_geral || i.status
            return status && status.toLowerCase() === 'pendente'
          }).length,
          comPlanoAcao: userInspections.filter(i => 
            i.plano_de_acao && i.plano_de_acao.trim() !== ''
          ).length,
        }

        // Adicionar estatísticas do usuário para o dashboard do desenvolvedor
        userStatsForDev.push({
          userId: profile.id,
          userName: userName,
          totalEquipamentos: totalEquipamentos,
          totalInspecoes: userStats.total,
          aprovadas: userStats.aprovadas,
          reprovadas: userStats.reprovadas,
          pendentes: userStats.pendentes,
          comPlanoAcao: userStats.comPlanoAcao,
        })

        const html = gerarHTML(userInspections, dataFormatada, userStats, userName)
        const emailEnviado = await enviarEmailSMTP(html, dataFormatada, userEmail, userName, false)
        
        if (emailEnviado) {
          resultados.push({ usuario: userName, email: userEmail, inspecoes: userInspections.length, enviado: true })
        } else {
          resultados.push({ usuario: userName, email: userEmail, inspecoes: userInspections.length, enviado: false })
        }
      } catch (err) {
        console.error(`[ERROR] Erro ao processar usuário ${profile.id}:`, err)
        continue
      }
    }

    if (DEV_EMAIL && (allInspectionsForDev.length > 0 || userStatsForDev.length > 0)) {
      const aprovadas = allInspectionsForDev.filter(i => {
        const status = i.status_geral || i.status || i.resultado_teste
        return status && (status.toLowerCase() === 'aprovado' || status.toLowerCase() === 'ok')
      }).length
      const total = allInspectionsForDev.length
      const taxaAprovacao = total > 0 ? (aprovadas / total * 100) : 0

      const devStats: Stats = {
        total,
        aprovadas,
        reprovadas: allInspectionsForDev.filter(i => {
          const status = i.status_geral || i.status || i.resultado_teste
          return status && (status.toLowerCase() === 'reprovado' || status.toLowerCase() === 'nao_conforme')
        }).length,
        pendentes: allInspectionsForDev.filter(i => {
          const status = i.status_geral || i.status
          return status && status.toLowerCase() === 'pendente'
        }).length,
        comPlanoAcao: allInspectionsForDev.filter(i => 
          i.plano_de_acao && i.plano_de_acao.trim() !== ''
        ).length,
        taxaAprovacao: parseFloat(taxaAprovacao.toFixed(1)),
      }

      const devHtml = gerarHTMLDashboardDev(allInspectionsForDev, dataFormatada, devStats, userStatsForDev)
      await enviarEmailSMTP(devHtml, dataFormatada, DEV_EMAIL, 'Desenvolvedor', true)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatórios enviados com sucesso',
        data: dataFormatada,
        resultados: resultados,
        total_usuarios: profiles.length,
        total_emails_enviados: resultados.filter(r => r.enviado).length,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[ERROR] Erro ao processar relatório:', error)
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
    return dt.toLocaleDateString('pt-BR')
  } catch {
    return data
  }
}

function formatarStatus(status: string | null | undefined): string {
  if (!status) return 'N/A'
  const statusMap: Record<string, string> = {
    'aprovado': 'Aprovado',
    'ok': 'Aprovado',
    'reprovado': 'Reprovado',
    'nao_conforme': 'Não Conforme',
    'pendente': 'Pendente',
  }
  return statusMap[status.toLowerCase()] || status
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return '#8E8E93'
  const statusLower = status.toLowerCase()
  if (statusLower === 'aprovado' || statusLower === 'ok') return '#53D769'
  if (statusLower === 'reprovado' || statusLower === 'nao_conforme') return '#FC3D39'
  if (statusLower === 'pendente') return '#FFCC00'
  return '#8E8E93'
}

function gerarCardGlassmorphism(valor: string, label: string, cor: string = '#fff', icon: string = ''): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${cor}30, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">${label}</td>${icon ? `<td align="right" style="font-size: 24px;">${icon}</td>` : '<td></td>'}</tr><tr><td colspan="2" style="color: ${cor}; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px ${cor}50;">${valor}</td></tr></table></td></tr></table>`
}

function gerarProgressBarTable(percentual: number, cor: string): string {
  const largura = Math.max(5, Math.min(100, percentual))
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td style="background-color: rgba(255,255,255,0.1); height: 12px; padding: 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td width="${largura}%" style="background-color: ${cor}; height: 12px; padding: 0;"></td><td width="${100 - largura}%" style="padding: 0;"></td></tr></table></td></tr></table>`
}

function gerarHTML(inspecoes: InspectionRecord[], data: string, stats: Stats, userName?: string, isDevReport?: boolean): string {
  const dataFormatadaBR = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const dataGeracao = new Date().toLocaleString('pt-BR')

  const card1 = gerarCardGlassmorphism(String(stats.total), 'Total de Inspeções', '#fff', '📊')
  const card2 = gerarCardGlassmorphism(String(stats.aprovadas), 'Aprovadas', '#53D769', '✅')
  const card3 = gerarCardGlassmorphism(String(stats.reprovadas), 'Reprovadas', '#FC3D39', '❌')
  const card4 = gerarCardGlassmorphism(String(stats.pendentes), 'Pendentes', '#FFCC00', '⚠️')
  const card5 = gerarCardGlassmorphism(String(stats.comPlanoAcao), 'Com Plano de Ação', '#53D769', '📋')

  const cardsStats = `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="20%" style="padding-right: 15px; vertical-align: top;">${card1}</td><td width="20%" style="padding: 0 15px; vertical-align: top;">${card2}</td><td width="20%" style="padding: 0 15px; vertical-align: top;">${card3}</td><td width="20%" style="padding: 0 15px; vertical-align: top;">${card4}</td><td width="20%" style="padding-left: 15px; vertical-align: top;">${card5}</td></tr></table>`

  let tabelaHTML = ''
  if (stats.total === 0) {
    tabelaHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="text-align: center; padding: 40px; color: #8E8E93;">Nenhuma inspeção encontrada para esta data.</td></tr></table>`
  } else {
    let linhas = ''
    for (const insp of inspecoes.slice(0, 50)) {
      const id = insp.equipment_id || insp.id || '-'
      const tipo = insp.equipment_type || 'N/A'
      const status = formatarStatus(insp.status_geral || insp.status || insp.resultado_teste)
      const statusColor = getStatusColor(insp.status_geral || insp.status || insp.resultado_teste)
      const observacoes = (insp.observacoes_gerais || insp.observacoes || '-').substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const temPlanoAcao = insp.plano_de_acao && insp.plano_de_acao.trim() !== '' ? 'Sim' : 'Não'
      const dataInspecao = formatarData(insp.data_inspecao || insp.data_servico || insp.data_teste || '')

      linhas += `<tr style="background: rgba(255,255,255,0.02);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="background-color: ${statusColor}30; color: ${statusColor}; padding: 4px 12px; font-size: 12px; font-weight: 600; box-shadow: 0 0 10px ${statusColor}40;">${status}</span></td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${dataInspecao}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${observacoes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${temPlanoAcao}</td></tr>`
    }

    if (inspecoes.length > 50) {
      linhas += `<tr><td colspan="6" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${inspecoes.length - 50} inspeções (mostrando apenas as primeiras 50)</td></tr>`
    }

    tabelaHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">ID Equipamento</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tipo</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Status</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Data</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Observações</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Plano de Ação</th></tr></thead><tbody>${linhas}</tbody></table>`
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Relatório de Inspeções - ${dataFormatadaBR}</title></head><body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, rgba(28,28,30,0.85) 0%, rgba(28,28,30,0.75) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 40px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 32px; font-weight: bold; padding-bottom: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.3);">🔍 Relatório Diário de Inspeções - ISF IA${userName ? ` - ${userName}` : ''}${isDevReport ? ' [CONSOLIDADO]' : ''}</td></tr><tr><td style="color: #8E8E93; font-size: 16px; padding-bottom: 30px;">Data: ${dataFormatadaBR}</td></tr><tr><td>${cardsStats}</td></tr><tr><td style="padding-top: 30px;"><h3 style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 15px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">📋 Inspeções Realizadas no Dia</h3>${tabelaHTML}</td></tr><tr><td style="padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); color: #8E8E93; font-size: 12px; text-align: center;"><p>Relatório gerado automaticamente em ${dataGeracao}</p><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p></td></tr></table></td></tr></table></body></html>`
}

function gerarHTMLDashboardDev(
  inspecoes: InspectionRecord[], 
  data: string, 
  stats: Stats,
  userStatsForDev?: UserStatsForDev[]
): string {
  const dataFormatadaBR = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const dataGeracao = new Date().toLocaleString('pt-BR')
  
  const percentualAprovadas = stats.total > 0 ? (stats.aprovadas / stats.total * 100) : 0
  const percentualReprovadas = stats.total > 0 ? (stats.reprovadas / stats.total * 100) : 0
  const percentualPendentes = stats.total > 0 ? (stats.pendentes / stats.total * 100) : 0

  const card1 = gerarCardGlassmorphism(String(stats.total), 'Inspeções do Dia', '#fff', '📊')

  const card2 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #53D76930, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Taxa de Aprovação</td><td align="right" style="font-size: 24px;">✅</td></tr><tr><td colspan="2" align="center" style="padding: 20px 0;"><table width="120" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td align="center" style="background: linear-gradient(135deg, rgba(83,215,105,0.2) 0%, rgba(83,215,105,0.1) 100%); border: 8px solid ${stats.taxaAprovacao && stats.taxaAprovacao > 0 ? '#53D769' : 'rgba(255,255,255,0.1)'}; border-radius: 50%; width: 84px; height: 84px; line-height: 84px; color: #fff; font-size: 32px; font-weight: bold; box-shadow: 0 0 20px ${stats.taxaAprovacao && stats.taxaAprovacao > 0 ? 'rgba(83,215,105,0.5)' : 'rgba(255,255,255,0.1)'}, inset 0 1px 0 rgba(255,255,255,0.1);">${stats.taxaAprovacao ? Math.round(stats.taxaAprovacao) : 0}%</td></tr></table></td></tr><tr><td colspan="2" align="center" style="color: rgba(255,255,255,0.6); font-size: 14px;">${stats.taxaAprovacao ? stats.taxaAprovacao.toFixed(1) : 0}% aprovadas</td></tr></table></td></tr></table>`

  const card3 = gerarCardGlassmorphism(String(stats.aprovadas), 'Aprovadas', '#53D769', '✅')
  const card4 = gerarCardGlassmorphism(String(stats.reprovadas), 'Reprovadas', '#FC3D39', '❌')
  const card5 = gerarCardGlassmorphism(String(stats.pendentes), 'Pendentes', '#FFCC00', '⚠️')
  const card6 = gerarCardGlassmorphism(String(stats.comPlanoAcao), 'Com Plano de Ação', '#53D769', '📋')

  const card7 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Status das Inspeções</td><td align="right" style="font-size: 24px;">📈</td></tr><tr><td colspan="2"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-bottom: 8px;">Aprovadas</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.aprovadas}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualAprovadas, '#53D769')}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-top: 12px; padding-bottom: 8px;">Reprovadas</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.reprovadas}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualReprovadas, '#FC3D39')}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-top: 12px; padding-bottom: 8px;">Pendentes</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.pendentes}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualPendentes, '#FFCC00')}</td></tr></table></td></tr></table></td></tr></table>`

  let tabelaUsuariosHTML = ''
  if (userStatsForDev && userStatsForDev.length > 0) {
    let linhasUsuarios = ''
    for (const userStat of userStatsForDev.slice(0, 20)) {
      const taxaAprovacaoUser = userStat.totalInspecoes > 0 ? (userStat.aprovadas / userStat.totalInspecoes * 100) : 0
      linhasUsuarios += `<tr style="background: rgba(255,255,255,0.02);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.userName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.totalEquipamentos}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.totalInspecoes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #53D769; font-size: 14px; font-weight: 600;">${userStat.aprovadas}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FC3D39; font-size: 14px; font-weight: 600;">${userStat.reprovadas}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFCC00; font-size: 14px; font-weight: 600;">${userStat.pendentes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${Math.round(taxaAprovacaoUser)}%</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #53D769; font-size: 14px; font-weight: 600;">${userStat.comPlanoAcao}</td></tr>`
    }
    if (userStatsForDev.length > 20) {
      linhasUsuarios += `<tr><td colspan="8" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${userStatsForDev.length - 20} usuários (mostrando apenas os primeiros 20)</td></tr>`
    }
    tabelaUsuariosHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 30px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Usuário</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Equipamentos</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Inspeções</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Aprovadas</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Reprovadas</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Pendentes</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Taxa Aprovação</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Com Plano de Ação</th></tr></thead><tbody>${linhasUsuarios}</tbody></table>`
  }

  let tabelaInspecoesHTML = ''
  if (inspecoes.length === 0) {
    tabelaInspecoesHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="text-align: center; padding: 40px; color: #8E8E93;">Nenhuma inspeção encontrada para esta data.</td></tr></table>`
  } else {
    let linhas = ''
    for (const insp of inspecoes.slice(0, 50)) {
      const id = insp.equipment_id || insp.id || '-'
      const tipo = insp.equipment_type || 'N/A'
      const status = formatarStatus(insp.status_geral || insp.status || insp.resultado_teste)
      const statusColor = getStatusColor(insp.status_geral || insp.status || insp.resultado_teste)
      const observacoes = (insp.observacoes_gerais || insp.observacoes || '-').substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const temPlanoAcao = insp.plano_de_acao && insp.plano_de_acao.trim() !== '' ? 'Sim' : 'Não'
      const dataInspecao = formatarData(insp.data_inspecao || insp.data_servico || insp.data_teste || '')

      linhas += `<tr style="background: rgba(255,255,255,0.02);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="background-color: ${statusColor}30; color: ${statusColor}; padding: 4px 12px; font-size: 12px; font-weight: 600; box-shadow: 0 0 10px ${statusColor}40;">${status}</span></td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${dataInspecao}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${observacoes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${temPlanoAcao}</td></tr>`
    }

    if (inspecoes.length > 50) {
      linhas += `<tr><td colspan="6" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${inspecoes.length - 50} inspeções (mostrando apenas as primeiras 50)</td></tr>`
    }

    tabelaInspecoesHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">ID Equipamento</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tipo</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Status</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Data</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Observações</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Plano de Ação</th></tr></thead><tbody>${linhas}</tbody></table>`
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard Diário - ${dataFormatadaBR}</title></head><body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; max-width: 1400px; margin: 0 auto;"><tr><td style="padding: 40px; background: linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,81,213,0.15) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(0,122,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 42px; font-weight: 700; padding-bottom: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.3);">📆 Dashboard Diário ISF IA</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 18px;">Relatório Consolidado - ${dataFormatadaBR}</td></tr></table></td></tr><tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="14.28%" style="padding-right: 15px; vertical-align: top;">${card1}</td><td width="14.28%" style="padding: 0 15px; vertical-align: top;">${card2}</td><td width="14.28%" style="padding: 0 15px; vertical-align: top;">${card3}</td><td width="14.28%" style="padding: 0 15px; vertical-align: top;">${card4}</td><td width="14.28%" style="padding: 0 15px; vertical-align: top;">${card5}</td><td width="14.28%" style="padding: 0 15px; vertical-align: top;">${card6}</td><td width="14.28%" style="padding-left: 15px; vertical-align: top;">${card7}</td></tr></table></td></tr><tr><td>${tabelaUsuariosHTML}</td></tr><tr><td style="padding-top: 30px;"><h3 style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 15px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">📋 Inspeções Realizadas no Dia</h3>${tabelaInspecoesHTML}</td></tr><tr><td style="padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 12px; text-align: center;"><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p><p>Relatório gerado automaticamente em ${dataGeracao}</p></td></tr></table></body></html>`
}

async function enviarEmailSMTP(html: string, data: string, userEmail: string, userName?: string, isDevReport?: boolean): Promise<boolean> {
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
    const dataFormatadaBR = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const emailDomain = EMAIL_FROM.includes('@') ? EMAIL_FROM.split('@')[1] : 'isfia.local'
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${emailDomain}>`
    
    const emailBody = [
      `From: ${EMAIL_FROM}`,
      `To: ${userEmail}`,
      `Subject: ${isDevReport ? '[DEV] ' : ''}Relatório Diário de Inspeções - ISF IA${userName ? ` - ${userName}` : ''} - ${dataFormatadaBR}`,
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

    const rcptTo = await sendCommand(`RCPT TO:<${userEmail}>`)
    if (!rcptTo.includes('250')) {
      throw new Error(`SMTP RCPT TO failed for ${userEmail}: ${rcptTo}`)
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

