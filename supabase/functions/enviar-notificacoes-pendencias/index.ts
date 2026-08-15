import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') || ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || ''
const DEV_EMAIL = Deno.env.get('DEV_EMAIL') || ''

interface PendenciaItem {
  equipment_id: string
  equipment_type: string
  data_reprovacao: string
  dias_desde_reprovacao: number
  observacoes: string
  localizacao: string
  user_id?: string
}

// Mapeamento de tabelas para suas colunas de status e data
interface TableConfig {
  table: string
  statusColumn: string
  dataColumn: string
  idColumn: string
}

const inspectionTableConfigs: TableConfig[] = [
  { table: 'inspecoes_extintores', statusColumn: 'status_geral', dataColumn: 'data_servico', idColumn: 'numero_identificacao' },
  { table: 'inspecoes_chuveiros_lava_olhos', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
  { table: 'inspecoes_camaras_espuma', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_camara' },
  { table: 'inspecoes_alarmes', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_sistema' },
  { table: 'inspecoes_canhoes_monitores', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
  { table: 'inspecoes_scba', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'numero_serie_equipamento' },
  { table: 'inspecoes_multigas', statusColumn: 'resultado_teste', dataColumn: 'data_teste', idColumn: 'id_equipamento' },
  { table: 'inspecoes_abrigos', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_abrigo' },
  { table: 'inspecoes_mangueiras', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_mangueira' },
  { table: 'custom_equipment_inspections', statusColumn: 'status_geral', dataColumn: 'data_inspecao', idColumn: 'id_equipamento' },
]

// Função auxiliar para verificar se usuário tem equipamentos
async function usuarioTemEquipamentos(supabase: any, userId: string): Promise<boolean> {
  const equipmentTables = [
    'extintores',
    'inventario_chuveiros_lava_olhos',
    'inventario_camaras_espuma',
    'inventario_alarmes',
    'inventario_canhoes_monitores',
    'conjuntos_autonomos',
    'inventario_multigas',
    'mangueiras',
    'abrigos',
    'custom_equipment'
  ]

  for (const table of equipmentTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1)

      if (!error && count && count > 0) {
        return true
      }
    } catch (err) {
      console.warn(`[WARN] Erro ao verificar ${table}:`, err)
      continue
    }
  }

  return false
}

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
    const noventaDiasAtras = new Date(hoje)
    noventaDiasAtras.setDate(hoje.getDate() - 90)
    const dataLimite = noventaDiasAtras.toISOString().split('T')[0]

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) {
      throw new Error(`Erro ao buscar usuários: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum usuário encontrado' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 }
      )
    }

    const resultados = []
    let allPendenciasForDev: PendenciaItem[] = []

    for (const profile of profiles) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
        
        if (authError || !authUser?.user?.email) {
          console.warn(`[WARN] Não foi possível obter email do usuário ${profile.id}`)
          continue
        }

        // Verificar se usuário tem equipamentos
        const temEquipamentos = await usuarioTemEquipamentos(supabase, profile.id)
        if (!temEquipamentos) {
          console.log(`[INFO] Usuário ${profile.id} não tem equipamentos registrados - pulando notificações`)
          continue
        }

        const userEmail = authUser.user.email
        const userName = profile.full_name || userEmail.split('@')[0]
        const pendencias: PendenciaItem[] = []

        // Processar cada tabela de inspeção com suas configurações específicas
        for (const config of inspectionTableConfigs) {
          try {
            // Construir query base
            let query = supabase
              .from(config.table)
              .select('*')
              .gte(config.dataColumn, dataLimite)
              .eq('user_id', profile.id)

            // Aplicar filtro de status usando a coluna correta
            // Para inspecoes_multigas, usar resultado_teste = 'reprovado'
            // Para outras tabelas, usar status_geral = 'reprovado'
            query = query.eq(config.statusColumn, 'reprovado')

            const { data, error } = await query

            if (error) {
              console.warn(`[WARN] Erro ao buscar ${config.table}:`, error.message)
              continue
            }

            if (data && data.length > 0) {
              for (const inspection of data) {
                const planoAcao = inspection.plano_de_acao || ''
                if (planoAcao.trim() === '' || planoAcao === 'N/A' || planoAcao === null) {
                  try {
                    const dataReprovacao = new Date(inspection[config.dataColumn])
                    const diasDesdeReprovacao = Math.floor(
                      (hoje.getTime() - dataReprovacao.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    
                    pendencias.push({
                      equipment_id: inspection[config.idColumn] || inspection.id || '-',
                      equipment_type: config.table.replace('inspecoes_', '').replace('_inspections', ''),
                      data_reprovacao: inspection[config.dataColumn],
                      dias_desde_reprovacao: diasDesdeReprovacao,
                      observacoes: inspection.observacoes_gerais || inspection.observacoes || '-',
                      localizacao: inspection.localizacao || '-',
                      user_id: profile.id
                    })
                  } catch (err) {
                    console.warn(`[WARN] Erro ao processar inspeção de ${config.table}:`, err)
                    continue
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`[WARN] Erro ao processar ${config.table}:`, err)
            continue
          }
        }

        allPendenciasForDev.push(...pendencias)

        if (pendencias.length > 0) {
          pendencias.sort((a, b) => b.dias_desde_reprovacao - a.dias_desde_reprovacao)

          const porTipo = pendencias.reduce((acc, pendencia) => {
            const tipo = pendencia.equipment_type
            if (!acc[tipo]) acc[tipo] = []
            acc[tipo].push(pendencia)
            return acc
          }, {} as Record<string, PendenciaItem[]>)

          const html = gerarHTML(pendencias, porTipo, userName)
          const emailEnviado = await enviarEmailSMTP(html, userEmail, userName, false)
          
          if (emailEnviado) {
            resultados.push({ usuario: userName, email: userEmail, pendencias: pendencias.length, enviado: true })
          } else {
            resultados.push({ usuario: userName, email: userEmail, pendencias: pendencias.length, enviado: false })
          }
        }
      } catch (err) {
        console.error(`[ERROR] Erro ao processar usuário ${profile.id}:`, err)
        continue
      }
    }

    if (DEV_EMAIL && allPendenciasForDev.length > 0) {
      allPendenciasForDev.sort((a, b) => b.dias_desde_reprovacao - a.dias_desde_reprovacao)

      const porTipo = allPendenciasForDev.reduce((acc, pendencia) => {
        const tipo = pendencia.equipment_type
        if (!acc[tipo]) acc[tipo] = []
        acc[tipo].push(pendencia)
        return acc
      }, {} as Record<string, PendenciaItem[]>)

      const devHtml = gerarHTML(allPendenciasForDev, porTipo, 'Desenvolvedor', true)
      await enviarEmailSMTP(devHtml, DEV_EMAIL, 'Desenvolvedor', true)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificações de pendências enviadas com sucesso',
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
    console.error('[ERROR] Erro ao processar pendências:', error)
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

function gerarHTML(pendencias: PendenciaItem[], porTipo: Record<string, PendenciaItem[]>, userName?: string, isDevReport?: boolean): string {
  const dataGeracao = new Date().toLocaleString('pt-BR')
  const total = pendencias.length
  const mediaDias = total > 0 ? (pendencias.reduce((sum, p) => sum + p.dias_desde_reprovacao, 0) / total).toFixed(1) : '0'

  let htmlPorTipo = ''
  for (const [tipo, items] of Object.entries(porTipo)) {
    htmlPorTipo += `<div style="margin-bottom: 30px;"><h2 style="color: #FFCC00; font-size: 20px; margin-bottom: 15px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')} (${items.length})</h2><table><thead><tr><th>ID</th><th>Data Reprovação</th><th>Dias Sem Plano</th><th>Observações</th><th>Localização</th></tr></thead><tbody>`
    for (const item of items.slice(0, 50)) {
      htmlPorTipo += `<tr><td>${String(item.equipment_id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td>${formatarData(item.data_reprovacao)}</td><td style="color: #FFCC00; font-weight: bold;">${item.dias_desde_reprovacao}</td><td>${(item.observacoes || '-').substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td>${(item.localizacao || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`
    }
    htmlPorTipo += `</tbody></table></div>`
  }

  if (total === 0) {
    htmlPorTipo = `<div class="no-data"><p>Nenhuma pendência encontrada. Todos os equipamentos reprovados possuem plano de ação!</p></div>`
  }

  const statsPorTipo = Object.entries(porTipo).map(([tipo, items]) => ({ tipo, quantidade: items.length }))

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Notificações de Pendências - ISF IA</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#000;color:#fff;padding:20px;line-height:1.6}.container{max-width:1200px;margin:0 auto;background:rgba(28,28,30,0.8);border-radius:24px;padding:40px;border:1px solid rgba(255,255,255,0.1)}h1{color:#fff;font-size:32px;margin-bottom:10px;font-weight:bold}.subtitle{color:#8E8E93;font-size:16px;margin-bottom:30px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px}.stat-card{background:#1A1A1A;border-radius:16px;padding:20px;text-align:center;border:1px solid rgba(255,255,255,0.1)}.stat-value{font-size:36px;font-weight:bold;color:#FFCC00;margin-bottom:5px}.stat-label{color:#8E8E93;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:20px;background:#1A1A1A;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)}thead{background:rgba(28,28,30,0.8)}th{padding:15px;text-align:left;color:#fff;font-weight:600;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.1)}td{padding:12px 15px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#fff}tr:hover{background:rgba(28,28,30,0.5)}.no-data{text-align:center;padding:40px;color:#8E8E93}.footer{margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#8E8E93;font-size:12px;text-align:center}h2{margin-top:20px}</style></head><body><div class="container"><h1>🚨 Notificações de Pendências - ISF IA${userName ? ` - ${userName}` : ''}${isDevReport ? ' [CONSOLIDADO]' : ''}</h1><p class="subtitle">Equipamentos reprovados sem plano de ação</p><div class="stats"><div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total de Pendências</div></div><div class="stat-card"><div class="stat-value">${mediaDias}</div><div class="stat-label">Média de Dias Sem Plano</div></div></div>${htmlPorTipo}<div class="footer"><p>Relatório gerado automaticamente em ${dataGeracao}</p><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p><p>Contato: <a href="mailto:isfiasegurancanotrabalho@gmail.com" style="color: #53D769;">isfiasegurancanotrabalho@gmail.com</a></p></div></div></body></html>`
}

async function enviarEmailSMTP(html: string, userEmail: string, userName?: string, isDevReport?: boolean): Promise<boolean> {
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
      `To: ${userEmail}`,
      `Subject: ${isDevReport ? '[DEV] ' : ''}🚨 Notificações de Pendências - ISF IA${userName ? ` - ${userName}` : ''} - ${dataFormatadaBR}`,
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

