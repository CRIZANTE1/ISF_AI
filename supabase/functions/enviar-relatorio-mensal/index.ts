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
  data_inspecao?: string | null
  data_servico?: string | null
  status_geral?: string | null
  status?: string | null
  observacoes_gerais?: string | null
  plano_de_acao?: string | null
  equipment_id?: string | null
  numero_identificacao?: string | null
  equipment_type?: string | null
  user_id?: string | null
}

interface EquipmentRecord {
  id: string | number
  equipment_id?: string | null
  id_equipamento?: string | null
  numero_identificacao?: string | null
  id_mangueira?: string | null
  id_camara?: string | null
  id_sistema?: string | null
  id_abrigo?: string | null
  numero_serie_equipamento?: string | null
  equipment_type?: string | null
  tipo?: string | null
  localizacao?: string | null
  status_geral?: string | null
  status?: string | null
  data_proxima_inspecao?: string | null
  proxima_inspecao?: string | null
  ultima_inspecao?: string | null
  dias_sem_inspecao?: number | null
  tem_pendencia?: boolean
  pendencia_descricao?: string | null
}

interface Stats {
  total: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  comPlanoAcao: number
  taxaAprovacao: number
  totalEquipamentos: number
  equipamentosNaoInspecionados: number
  pendenciasArrastando: number
}

interface UserStatsForDev {
  userId: string
  userName: string
  totalEquipamentos: number
  totalInspecoes: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  pendenciasArrastando: number
  equipamentosNaoInspecionados: number
}

interface EquipmentMapping {
  equipmentTable: string
  inspectionTable: string
  idField: string
  inspectionIdField: string
  dateField: string
  equipmentType: string
}

const equipmentMappings: EquipmentMapping[] = [
  { equipmentTable: 'extintores', inspectionTable: 'inspecoes_extintores', idField: 'numero_identificacao', inspectionIdField: 'numero_identificacao', dateField: 'data_servico', equipmentType: 'extintor' },
  { equipmentTable: 'inventario_chuveiros_lava_olhos', inspectionTable: 'inspecoes_chuveiros_lava_olhos', idField: 'id_equipamento', inspectionIdField: 'id_equipamento', dateField: 'data_inspecao', equipmentType: 'chuveiro_lavaolhos' },
  { equipmentTable: 'inventario_camaras_espuma', inspectionTable: 'inspecoes_camaras_espuma', idField: 'id_camara', inspectionIdField: 'id_camara', dateField: 'data_inspecao', equipmentType: 'camara_espuma' },
  { equipmentTable: 'inventario_alarmes', inspectionTable: 'inspecoes_alarmes', idField: 'id_sistema', inspectionIdField: 'id_sistema', dateField: 'data_inspecao', equipmentType: 'alarme' },
  { equipmentTable: 'inventario_canhoes_monitores', inspectionTable: 'inspecoes_canhoes_monitores', idField: 'id_equipamento', inspectionIdField: 'id_equipamento', dateField: 'data_inspecao', equipmentType: 'canhao_monitor' },
  { equipmentTable: 'conjuntos_autonomos', inspectionTable: 'inspecoes_scba', idField: 'numero_serie_equipamento', inspectionIdField: 'numero_serie_equipamento', dateField: 'data_inspecao', equipmentType: 'scba' },
  { equipmentTable: 'inventario_multigas', inspectionTable: 'inspecoes_multigas', idField: 'id_equipamento', inspectionIdField: 'id_equipamento', dateField: 'data_inspecao', equipmentType: 'multigas' },
  { equipmentTable: 'mangueiras', inspectionTable: 'inspecoes_mangueiras', idField: 'id_mangueira', inspectionIdField: 'id_mangueira', dateField: 'data_inspecao', equipmentType: 'mangueira' },
  { equipmentTable: 'abrigos', inspectionTable: 'inspecoes_abrigos', idField: 'id_abrigo', inspectionIdField: 'id_abrigo', dateField: 'data_inspecao', equipmentType: 'abrigo' },
  { equipmentTable: 'custom_equipment', inspectionTable: 'custom_equipment_inspections', idField: 'id_equipamento', inspectionIdField: 'id_equipamento', dateField: 'data_inspecao', equipmentType: 'custom' },
]

async function usuarioTemEquipamentos(supabase: any, userId: string): Promise<boolean> {
  for (const mapping of equipmentMappings) {
    try {
      const { count, error } = await supabase
        .from(mapping.equipmentTable)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1)

      if (!error && count && count > 0) {
        return true
      }
    } catch (err) {
      console.warn(`[WARN] Erro ao verificar ${mapping.equipmentTable}:`, err)
      continue
    }
  }
  return false
}

async function buscarEquipamentosCompletos(supabase: any, userId: string, dataInicio: string, dataFim: string): Promise<{
  equipamentos: EquipmentRecord[]
  inspecoesMes: InspectionRecord[]
  pendenciasArrastando: InspectionRecord[]
}> {
  const equipamentos: EquipmentRecord[] = []
  const inspecoesMes: InspectionRecord[] = []
  const pendenciasArrastando: InspectionRecord[] = []
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  for (const mapping of equipmentMappings) {
    try {
      const { data: equipamentosData, error: equipError } = await supabase
        .from(mapping.equipmentTable)
        .select('*')
        .eq('user_id', userId)

      if (equipError) {
        console.warn(`[WARN] Erro ao buscar ${mapping.equipmentTable}:`, equipError.message)
        continue
      }

      const { data: inspecoesMesData, error: inspMesError } = await supabase
        .from(mapping.inspectionTable)
        .select('*')
        .gte(mapping.dateField, dataInicio)
        .lte(mapping.dateField, dataFim)
        .eq('user_id', userId)
        .order(mapping.dateField, { ascending: false })

      if (inspMesError) {
        console.warn(`[WARN] Erro ao buscar inspeções do mês em ${mapping.inspectionTable}:`, inspMesError.message)
      }

      if (inspecoesMesData && inspecoesMesData.length > 0) {
        inspecoesMes.push(...inspecoesMesData.map((item: any) => ({
          ...item,
          equipment_type: mapping.equipmentType,
          data_inspecao: item[mapping.dateField] || item.data_inspecao || item.data_servico
        })))
      }

      const { data: pendenciasData, error: pendError } = await supabase
        .from(mapping.inspectionTable)
        .select('*')
        .lt(mapping.dateField, dataInicio)
        .eq('user_id', userId)
        .or('status_geral.eq.reprovado,status_geral.eq.pendente,status.eq.reprovado,status.eq.pendente,status_geral.eq.nao_conforme')
        .order(mapping.dateField, { ascending: false })

      if (pendError) {
        console.warn(`[WARN] Erro ao buscar pendências em ${mapping.inspectionTable}:`, pendError.message)
      }

      if (pendenciasData && pendenciasData.length > 0) {
        const pendenciasSemPlano = pendenciasData.filter((p: any) => 
          !p.plano_de_acao || p.plano_de_acao.trim() === ''
        )
        
        pendenciasArrastando.push(...pendenciasSemPlano.map((item: any) => ({
          ...item,
          equipment_type: mapping.equipmentType,
          data_inspecao: item[mapping.dateField] || item.data_inspecao || item.data_servico
        })))
      }

      if (equipamentosData && equipamentosData.length > 0) {
        for (const equip of equipamentosData) {
          const equipmentId = equip[mapping.idField] || equip.id || equip.equipment_id || '-'
          
          // Buscar última inspeção do equipamento
          const { data: ultimaInspecao, error: ultInspError } = await supabase
            .from(mapping.inspectionTable)
            .select(`${mapping.dateField}, status_geral, status, plano_de_acao, ${mapping.inspectionIdField}`)
            .eq('user_id', userId)
            .eq(mapping.inspectionIdField, equipmentId)
            .order(mapping.dateField, { ascending: false })
            .limit(1)

          // Se não encontrou, tentar buscar sem filtro de user_id (pode haver problema de sincronização)
          let ultimaInspecaoFinal = ultimaInspecao
          if ((!ultimaInspecao || ultimaInspecao.length === 0) && !ultInspError) {
            const { data: ultimaInspecaoAlt, error: ultInspErrorAlt } = await supabase
              .from(mapping.inspectionTable)
              .select(`${mapping.dateField}, status_geral, status, plano_de_acao, ${mapping.inspectionIdField}`)
              .eq(mapping.inspectionIdField, equipmentId)
              .order(mapping.dateField, { ascending: false })
              .limit(1)
            
            if (!ultInspErrorAlt && ultimaInspecaoAlt && ultimaInspecaoAlt.length > 0) {
              ultimaInspecaoFinal = ultimaInspecaoAlt
              console.log(`[DEBUG] Encontrada inspeção alternativa para equipamento ${equipmentId} (tipo: ${mapping.equipmentType})`)
            }
          }

          // Verificar também nas inspeções do mês se este equipamento foi inspecionado
          const inspecaoNoMes = inspecoesMesData?.find((insp: any) => {
            const inspId = insp[mapping.inspectionIdField] || insp.equipment_id || insp.numero_identificacao || insp.id
            // Comparar normalizando strings (trim, lowercase) para evitar problemas de formatação
            const inspIdNormalized = String(inspId || '').trim().toLowerCase()
            const equipmentIdNormalized = String(equipmentId || '').trim().toLowerCase()
            return inspIdNormalized === equipmentIdNormalized && inspIdNormalized !== ''
          })

          let diasSemInspecao: number | null = null
          let temPendencia = false
          let pendenciaDescricao: string | null = null
          let ultimaInspecaoData: string | null = null

          // Determinar qual inspeção usar: priorizar a mais recente entre a última inspeção geral e a do mês
          let inspecaoParaUsar: any = null
          if (ultimaInspecaoFinal && ultimaInspecaoFinal.length > 0 && inspecaoNoMes) {
            // Comparar datas para escolher a mais recente
            const dataUltimaGeral = ultimaInspecaoFinal[0][mapping.dateField] || ultimaInspecaoFinal[0].data_inspecao || ultimaInspecaoFinal[0].data_servico
            const dataInspecaoMes = inspecaoNoMes[mapping.dateField] || inspecaoNoMes.data_inspecao || inspecaoNoMes.data_servico
            if (dataUltimaGeral && dataInspecaoMes) {
              const dataGeral = new Date(dataUltimaGeral)
              const dataMes = new Date(dataInspecaoMes)
              inspecaoParaUsar = dataMes > dataGeral ? inspecaoNoMes : ultimaInspecaoFinal[0]
            } else {
              inspecaoParaUsar = inspecaoNoMes || ultimaInspecaoFinal[0]
            }
          } else if (ultimaInspecaoFinal && ultimaInspecaoFinal.length > 0) {
            inspecaoParaUsar = ultimaInspecaoFinal[0]
          } else if (inspecaoNoMes) {
            inspecaoParaUsar = inspecaoNoMes
            console.log(`[DEBUG] Equipamento ${equipmentId} (tipo: ${mapping.equipmentType}) encontrado nas inspeções do mês mas não na busca geral`)
          }

          if (inspecaoParaUsar) {
            ultimaInspecaoData = inspecaoParaUsar[mapping.dateField] || inspecaoParaUsar.data_inspecao || inspecaoParaUsar.data_servico
            if (ultimaInspecaoData) {
              const dataUltimaInspecao = new Date(ultimaInspecaoData)
              const diffTime = hoje.getTime() - dataUltimaInspecao.getTime()
              diasSemInspecao = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            }
            
            const status = inspecaoParaUsar.status_geral || inspecaoParaUsar.status || ''
            const temPlanoAcao = inspecaoParaUsar.plano_de_acao && inspecaoParaUsar.plano_de_acao.trim() !== ''
            
            if ((status === 'reprovado' || status === 'pendente' || status === 'nao_conforme') && !temPlanoAcao) {
              temPendencia = true
              pendenciaDescricao = `Status: ${status} sem plano de ação`
            }
          } else {
            // Se não encontrou inspeção e houve erro, logar para debug
            if (ultInspError) {
              console.warn(`[WARN] Erro ao buscar última inspeção para equipamento ${equipmentId} (tipo: ${mapping.equipmentType}):`, ultInspError.message)
            }
            diasSemInspecao = null
          }

          equipamentos.push({
            id: equipmentId,
            equipment_id: equipmentId,
            equipment_type: mapping.equipmentType,
            localizacao: equip.localizacao || equip.local || null,
            status_geral: equip.status_geral || equip.status || null,
            status: equip.status || equip.status_geral || null,
            data_proxima_inspecao: equip.data_proxima_inspecao || equip.proxima_inspecao || null,
            proxima_inspecao: equip.proxima_inspecao || equip.data_proxima_inspecao || null,
            ultima_inspecao: ultimaInspecaoData,
            dias_sem_inspecao: diasSemInspecao,
            tem_pendencia: temPendencia,
            pendencia_descricao: pendenciaDescricao
          })
        }
      }
    } catch (err) {
      console.warn(`[WARN] Erro ao processar ${mapping.equipmentTable}:`, err)
      continue
    }
  }

  return { equipamentos, inspecoesMes, pendenciasArrastando }
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

    const supabaseUrl = Deno.env.get('SUPA_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPA_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPA_URL e SUPA_SERVICE_ROLE_KEY devem estar configurados')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const hoje = new Date()
    const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual)
    ultimoDiaMesAnterior.setDate(0)
    const primeiroDiaMesAnterior = new Date(ultimoDiaMesAnterior.getFullYear(), ultimoDiaMesAnterior.getMonth(), 1)
    
    const dataInicio = primeiroDiaMesAnterior.toISOString().split('T')[0]
    const dataFim = ultimoDiaMesAnterior.toISOString().split('T')[0]

    console.log(`[INFO] Buscando dados do mês: ${dataInicio} a ${dataFim}`)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) {
      throw new Error(`Erro ao buscar usuários: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum usuário encontrado', periodo: { inicio: dataInicio, fim: dataFim } }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200 }
      )
    }

    const resultados: Array<{
      usuario: string
      email: string
      inspecoes: number
      equipamentos: number
      pendencias: number
      enviado: boolean
    }> = []
    const allInspectionsForDev: InspectionRecord[] = []
    const allEquipmentsForDev: EquipmentRecord[] = []
    const allPendenciasForDev: InspectionRecord[] = []
    const userStatsForDev: UserStatsForDev[] = []

    for (const profile of profiles) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
        
        if (authError || !authUser?.user?.email) {
          console.warn(`[WARN] Não foi possível obter email do usuário ${profile.id}`)
          continue
        }

        const temEquipamentos = await usuarioTemEquipamentos(supabase, profile.id)
        if (!temEquipamentos) {
          console.log(`[INFO] Usuário ${profile.id} não tem equipamentos registrados - pulando relatório`)
          continue
        }

        const userEmail = authUser.user.email
        const userName = profile.full_name || userEmail.split('@')[0]
        
        const { equipamentos, inspecoesMes, pendenciasArrastando } = await buscarEquipamentosCompletos(
          supabase, 
          profile.id, 
          dataInicio, 
          dataFim
        )

        allInspectionsForDev.push(...inspecoesMes)
        allEquipmentsForDev.push(...equipamentos)
        allPendenciasForDev.push(...pendenciasArrastando)

        const aprovadas = inspecoesMes.filter(i => 
          i.status_geral === 'aprovado' || i.status === 'aprovado' || i.status_geral === 'ok'
        ).length
        const total = inspecoesMes.length
        const taxaAprovacao = total > 0 ? (aprovadas / total * 100) : 0
        
        const equipamentosNaoInspecionados = equipamentos.filter(e => 
          e.ultima_inspecao === null || (e.dias_sem_inspecao !== null && e.dias_sem_inspecao !== undefined && e.dias_sem_inspecao > 90)
        ).length
        
        const pendenciasArrastandoCount = pendenciasArrastando.length

        const userStats: Stats = {
          total,
          aprovadas,
          reprovadas: inspecoesMes.filter(i => 
            i.status_geral === 'reprovado' || i.status === 'reprovado' || i.status_geral === 'nao_conforme'
          ).length,
          pendentes: inspecoesMes.filter(i => 
            i.status_geral === 'pendente' || i.status === 'pendente'
          ).length,
          comPlanoAcao: inspecoesMes.filter(i => 
            i.plano_de_acao && i.plano_de_acao.trim() !== ''
          ).length,
          taxaAprovacao: parseFloat(taxaAprovacao.toFixed(1)),
          totalEquipamentos: equipamentos.length,
          equipamentosNaoInspecionados,
          pendenciasArrastando: pendenciasArrastandoCount
        }

        userStatsForDev.push({
          userId: profile.id,
          userName: userName,
          totalEquipamentos: equipamentos.length,
          totalInspecoes: inspecoesMes.length,
          aprovadas: userStats.aprovadas,
          reprovadas: userStats.reprovadas,
          pendentes: userStats.pendentes,
          pendenciasArrastando: pendenciasArrastandoCount,
          equipamentosNaoInspecionados: equipamentosNaoInspecionados
        })

        const html = gerarHTML(equipamentos, inspecoesMes, pendenciasArrastando, dataInicio, dataFim, userStats, userName)
        const emailEnviado = await enviarEmailSMTP(html, dataInicio, dataFim, userEmail, userName, false)
        
        if (emailEnviado) {
          resultados.push({ 
            usuario: userName, 
            email: userEmail, 
            inspecoes: inspecoesMes.length, 
            equipamentos: equipamentos.length,
            pendencias: pendenciasArrastandoCount,
            enviado: true 
          })
        } else {
          resultados.push({ 
            usuario: userName, 
            email: userEmail, 
            inspecoes: inspecoesMes.length, 
            equipamentos: equipamentos.length,
            pendencias: pendenciasArrastandoCount,
            enviado: false 
          })
        }
      } catch (err) {
        console.error(`[ERROR] Erro ao processar usuário ${profile.id}:`, err)
        continue
      }
    }

    if (DEV_EMAIL && (allInspectionsForDev.length > 0 || allEquipmentsForDev.length > 0)) {
      const aprovadas = allInspectionsForDev.filter(i => 
        i.status_geral === 'aprovado' || i.status === 'aprovado' || i.status_geral === 'ok'
      ).length
      const total = allInspectionsForDev.length
      const taxaAprovacao = total > 0 ? (aprovadas / total * 100) : 0
      
      const equipamentosNaoInspecionados = allEquipmentsForDev.filter(e => 
        e.ultima_inspecao === null || (e.dias_sem_inspecao !== null && e.dias_sem_inspecao !== undefined && e.dias_sem_inspecao > 90)
      ).length

      const devStats: Stats = {
        total,
        aprovadas,
        reprovadas: allInspectionsForDev.filter(i => 
          i.status_geral === 'reprovado' || i.status === 'reprovado' || i.status_geral === 'nao_conforme'
        ).length,
        pendentes: allInspectionsForDev.filter(i => 
          i.status_geral === 'pendente' || i.status === 'pendente'
        ).length,
        comPlanoAcao: allInspectionsForDev.filter(i => 
          i.plano_de_acao && i.plano_de_acao.trim() !== ''
        ).length,
        taxaAprovacao: parseFloat(taxaAprovacao.toFixed(1)),
        totalEquipamentos: allEquipmentsForDev.length,
        equipamentosNaoInspecionados,
        pendenciasArrastando: allPendenciasForDev.length
      }

      const devHtml = gerarHTMLDashboardDev(allEquipmentsForDev, allInspectionsForDev, allPendenciasForDev, dataInicio, dataFim, devStats, userStatsForDev)
      await enviarEmailSMTP(devHtml, dataInicio, dataFim, DEV_EMAIL, 'Desenvolvedor', true)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatórios mensais enviados com sucesso',
        periodo: { inicio: dataInicio, fim: dataFim },
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

function gerarProgressBarTable(percentual: number, cor: string): string {
  const largura = Math.max(5, Math.min(100, percentual))
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td style="background-color: rgba(255,255,255,0.1); height: 12px; padding: 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td width="${largura}%" style="background-color: ${cor}; height: 12px; padding: 0;"></td><td width="${100 - largura}%" style="padding: 0;"></td></tr></table></td></tr></table>`
}

function gerarCardGlassmorphism(valor: string, label: string, cor: string = '#fff', icon: string = ''): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${cor}30, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">${label}</td>${icon ? `<td align="right" style="font-size: 24px;">${icon}</td>` : '<td></td>'}</tr><tr><td colspan="2" style="color: ${cor}; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px ${cor}50;">${valor}</td></tr></table></td></tr></table>`
}

function gerarHTML(
  equipamentos: EquipmentRecord[], 
  inspecoes: InspectionRecord[], 
  pendencias: InspectionRecord[], 
  dataInicio: string, 
  dataFim: string, 
  stats: Stats, 
  userName?: string, 
  isDevReport?: boolean
): string {
  const mesAno = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dataGeracao = new Date().toLocaleString('pt-BR')

  let tabelaInspecoesHTML = ''
  if (inspecoes.length === 0) {
    tabelaInspecoesHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="text-align: center; padding: 40px; color: #8E8E93;">Nenhuma inspeção realizada neste período.</td></tr></table>`
  } else {
    let linhas = ''
    for (const insp of inspecoes.slice(0, 50)) {
      const id = insp.equipment_id || insp.numero_identificacao || insp.id || '-'
      const tipo = insp.equipment_type || 'N/A'
      const status = formatarStatus(insp.status_geral || insp.status)
      const statusColor = getStatusColor(insp.status_geral || insp.status)
      const observacoes = insp.observacoes_gerais ? insp.observacoes_gerais.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '-'
      const temPlanoAcao = insp.plano_de_acao && insp.plano_de_acao.trim() !== '' ? 'Sim' : 'Não'
      const dataInspecao = formatarData(insp.data_inspecao || insp.data_servico || '')

      linhas += `<tr style="background: rgba(255,255,255,0.02);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="background-color: ${statusColor}30; color: ${statusColor}; padding: 4px 12px; font-size: 12px; font-weight: 600; box-shadow: 0 0 10px ${statusColor}40;">${status}</span></td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${dataInspecao}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${observacoes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${temPlanoAcao}</td></tr>`
    }

    if (inspecoes.length > 50) {
      linhas += `<tr><td colspan="6" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${inspecoes.length - 50} inspeções (mostrando apenas as primeiras 50)</td></tr>`
    }

    tabelaInspecoesHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">ID Equipamento</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tipo</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Status</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Data</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Observações</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Plano de Ação</th></tr></thead><tbody>${linhas}</tbody></table>`
  }

  let tabelaPendenciasHTML = ''
  if (pendencias.length > 0) {
    let linhasPendencias = ''
    for (const pend of pendencias.slice(0, 30)) {
      const id = pend.equipment_id || pend.numero_identificacao || pend.id || '-'
      const tipo = pend.equipment_type || 'N/A'
      const status = formatarStatus(pend.status_geral || pend.status)
      const statusColor = getStatusColor(pend.status_geral || pend.status)
      const dataInspecao = formatarData(pend.data_inspecao || pend.data_servico || '')
      const observacoes = pend.observacoes_gerais ? pend.observacoes_gerais.substring(0, 80).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '-'

      linhasPendencias += `<tr style="background: rgba(255,204,0,0.05);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="background-color: ${statusColor}30; color: ${statusColor}; padding: 4px 12px; font-size: 12px; font-weight: 600; box-shadow: 0 0 10px ${statusColor}40;">${status}</span></td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${dataInspecao}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${observacoes}</td></tr>`
    }

    if (pendencias.length > 30) {
      linhasPendencias += `<tr><td colspan="5" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${pendencias.length - 30} pendências (mostrando apenas as primeiras 30)</td></tr>`
    }

    tabelaPendenciasHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,204,0,0.3); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(255,204,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">ID Equipamento</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tipo</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Status</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Data Inspeção</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Observações</th></tr></thead><tbody>${linhasPendencias}</tbody></table>`
  }

  const equipamentosNaoInspecionados = equipamentos.filter(e => 
    e.ultima_inspecao === null || (e.dias_sem_inspecao !== null && e.dias_sem_inspecao !== undefined && e.dias_sem_inspecao > 90)
  )
  
  let tabelaNaoInspecionadosHTML = ''
  if (equipamentosNaoInspecionados.length > 0) {
    let linhasNaoInspecionados = ''
    for (const equip of equipamentosNaoInspecionados.slice(0, 30)) {
      const id = equip.equipment_id || equip.id || '-'
      const tipo = equip.equipment_type || 'N/A'
      const localizacao = equip.localizacao || '-'
      const diasSemInspecao = equip.dias_sem_inspecao !== null ? `${equip.dias_sem_inspecao} dias` : 'Nunca inspecionado'
      const ultimaInspecao = equip.ultima_inspecao ? formatarData(equip.ultima_inspecao) : '-'

      linhasNaoInspecionados += `<tr style="background: rgba(255,204,0,0.05);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${localizacao.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFCC00; font-size: 14px; font-weight: 600; text-shadow: 0 0 10px rgba(255,204,0,0.5);">${diasSemInspecao}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${ultimaInspecao}</td></tr>`
    }

    if (equipamentosNaoInspecionados.length > 30) {
      linhasNaoInspecionados += `<tr><td colspan="5" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${equipamentosNaoInspecionados.length - 30} equipamentos (mostrando apenas os primeiros 30)</td></tr>`
    }

    tabelaNaoInspecionadosHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,204,0,0.3); border-radius: 20px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(255,204,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">ID Equipamento</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tipo</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Localização</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tempo sem Inspeção</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Última Inspeção</th></tr></thead><tbody>${linhasNaoInspecionados}</tbody></table>`
  }

  const cardsStats = `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="16.66%" style="padding-right: 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.total), 'Inspeções do Mês', '#fff', '📊')}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.aprovadas), 'Aprovadas', '#53D769', '✅')}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.reprovadas), 'Reprovadas', '#FC3D39', '❌')}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.pendentes), 'Pendentes', '#FFCC00', '⚠️')}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${gerarCardGlassmorphism(`${stats.taxaAprovacao}%`, 'Taxa Aprovação', '#53D769', '📈')}</td><td width="16.66%" style="padding-left: 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.totalEquipamentos), 'Total Equipamentos', '#fff', '🔧')}</td></tr></table>`

  const cardsAdicionais = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;"><tr><td width="33.33%" style="padding-right: 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.equipamentosNaoInspecionados), 'Não Inspecionados', '#FFCC00', '🔍')}</td><td width="33.33%" style="padding: 0 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.pendenciasArrastando), 'Pendências Arrastando', '#FC3D39', '⚠️')}</td><td width="33.33%" style="padding-left: 15px; vertical-align: top;">${gerarCardGlassmorphism(String(stats.comPlanoAcao), 'Com Plano de Ação', '#53D769', '📋')}</td></tr></table>`

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Relatório Mensal - ${mesAno}</title></head><body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, rgba(28,28,30,0.85) 0%, rgba(28,28,30,0.75) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 40px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 32px; font-weight: bold; padding-bottom: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.3);">📆 Relatório Mensal - ISF IA${userName ? ` - ${userName}` : ''}${isDevReport ? ' [CONSOLIDADO]' : ''}</td></tr><tr><td style="color: #8E8E93; font-size: 16px; padding-bottom: 30px;">Mês: ${mesAno}</td></tr><tr><td>${cardsStats}</td></tr><tr><td>${cardsAdicionais}</td></tr><tr><td style="padding-top: 30px;"><h3 style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 15px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">📋 Inspeções Realizadas no Mês</h3>${tabelaInspecoesHTML}</td></tr>${pendencias.length > 0 ? `<tr><td style="padding-top: 30px;"><h3 style="color: #FFCC00; font-size: 20px; font-weight: 600; margin-bottom: 15px; text-shadow: 0 0 15px rgba(255,204,0,0.4);">⚠️ Pendências que se Arrastam (sem plano de ação)</h3>${tabelaPendenciasHTML}</td></tr>` : ''}${equipamentosNaoInspecionados.length > 0 ? `<tr><td style="padding-top: 30px;"><h3 style="color: #FFCC00; font-size: 20px; font-weight: 600; margin-bottom: 15px; text-shadow: 0 0 15px rgba(255,204,0,0.4);">🔍 Equipamentos Não Inspecionados (mais de 90 dias ou nunca)</h3>${tabelaNaoInspecionadosHTML}</td></tr>` : ''}<tr><td style="padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); color: #8E8E93; font-size: 12px; text-align: center;"><p>Relatório gerado automaticamente em ${dataGeracao}</p><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p></td></tr></table></td></tr></table></body></html>`
}

function gerarHTMLDashboardDev(
  equipamentos: EquipmentRecord[], 
  inspecoes: InspectionRecord[], 
  pendencias: InspectionRecord[], 
  dataInicio: string, 
  dataFim: string, 
  stats: Stats,
  userStatsForDev?: UserStatsForDev[]
): string {
  const mesAno = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dataGeracao = new Date().toLocaleString('pt-BR')
  
  const percentualAprovadas = stats.total > 0 ? (stats.aprovadas / stats.total * 100) : 0
  const percentualReprovadas = stats.total > 0 ? (stats.reprovadas / stats.total * 100) : 0
  const percentualPendentes = stats.total > 0 ? (stats.pendentes / stats.total * 100) : 0
  const percentualNaoInspecionados = stats.totalEquipamentos > 0 ? (stats.equipamentosNaoInspecionados / stats.totalEquipamentos * 100) : 0

  const card1 = gerarCardGlassmorphism(String(stats.total), 'Inspeções do Mês', '#fff', '📊')

  const card2 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #53D76930, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Taxa de Aprovação</td><td align="right" style="font-size: 24px;">✅</td></tr><tr><td colspan="2" align="center" style="padding: 20px 0;"><table width="120" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;"><tr><td align="center" style="background: linear-gradient(135deg, rgba(83,215,105,0.2) 0%, rgba(83,215,105,0.1) 100%); border: 8px solid ${stats.taxaAprovacao > 0 ? '#53D769' : 'rgba(255,255,255,0.1)'}; border-radius: 50%; width: 84px; height: 84px; line-height: 84px; color: #fff; font-size: 32px; font-weight: bold; box-shadow: 0 0 20px ${stats.taxaAprovacao > 0 ? 'rgba(83,215,105,0.5)' : 'rgba(255,255,255,0.1)'}, inset 0 1px 0 rgba(255,255,255,0.1);">${Math.round(stats.taxaAprovacao)}%</td></tr></table></td></tr><tr><td colspan="2" align="center" style="color: rgba(255,255,255,0.6); font-size: 14px;">${stats.taxaAprovacao}% aprovadas</td></tr></table></td></tr></table>`

  const card3 = gerarCardGlassmorphism(String(stats.totalEquipamentos), 'Total Equipamentos', '#fff', '🔧')

  const card4 = gerarCardGlassmorphism(String(stats.pendenciasArrastando), 'Pendências Arrastando', '#FC3D39', '⚠️')

  const card5 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 20px #FFCC0030, inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Não Inspecionados</td><td align="right" style="font-size: 24px;">🔍</td></tr><tr><td colspan="2" style="color: #FFCC00; font-size: 56px; font-weight: bold; padding: 20px 0; text-shadow: 0 0 20px rgba(255,204,0,0.5);">${stats.equipamentosNaoInspecionados}</td></tr><tr><td colspan="2" style="color: rgba(255,255,255,0.6); font-size: 14px; padding-bottom: 20px;">Mais de 90 dias ou nunca</td></tr><tr><td colspan="2"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-bottom: 8px;">Percentual</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${Math.round(percentualNaoInspecionados)}%</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualNaoInspecionados, '#FFCC00')}</td></tr></table></td></tr></table></td></tr></table>`

  const card6 = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px;">Status das Inspeções</td><td align="right" style="font-size: 24px;">📈</td></tr><tr><td colspan="2"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-bottom: 8px;">Aprovadas</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.aprovadas}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualAprovadas, '#53D769')}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-top: 12px; padding-bottom: 8px;">Reprovadas</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.reprovadas}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualReprovadas, '#FC3D39')}</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 12px; padding-top: 12px; padding-bottom: 8px;">Pendentes</td><td align="right" style="color: rgba(255,255,255,0.7); font-size: 12px;">${stats.pendentes}</td></tr><tr><td colspan="2">${gerarProgressBarTable(percentualPendentes, '#FFCC00')}</td></tr></table></td></tr></table></td></tr></table>`

  let topEquipamentos = ''
  const equipamentosCount: Record<string, number> = {}
  for (const equip of equipamentos) {
    const tipo = equip.equipment_type || 'outros'
    equipamentosCount[tipo] = (equipamentosCount[tipo] || 0) + 1
  }
  
  const top5 = Object.entries(equipamentosCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  if (top5.length > 0) {
    topEquipamentos = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><tr><td style="padding: 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 20px; font-weight: 600; padding-bottom: 20px; text-shadow: 0 0 10px rgba(255,255,255,0.2);">🔧 Top 5 Tipos de Equipamentos</td></tr>`
    for (const [tipo, count] of top5) {
      const percentual = stats.totalEquipamentos > 0 ? (count / stats.totalEquipamentos * 100) : 0
      topEquipamentos += `<tr><td style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><table cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 16px; font-weight: 600; padding-bottom: 6px;">${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr><tr><td style="color: rgba(255,255,255,0.6); font-size: 13px;">${count} equipamentos</td></tr></table></td><td align="right" valign="top"><table cellpadding="0" cellspacing="0" border="0" align="right" width="120"><tr><td align="right" style="padding-bottom: 8px;">${gerarProgressBarTable(percentual, '#007AFF')}</td></tr><tr><td align="right" style="color: rgba(255,255,255,0.5); font-size: 12px;">${Math.round(percentual)}%</td></tr></table></td></tr></table></td></tr>`
    }
    topEquipamentos += `</table></td></tr></table>`
  }

  let tabelaUsuariosHTML = ''
  if (userStatsForDev && userStatsForDev.length > 0) {
    let linhasUsuarios = ''
    for (const userStat of userStatsForDev.slice(0, 20)) {
      const taxaAprovacaoUser = userStat.totalInspecoes > 0 ? (userStat.aprovadas / userStat.totalInspecoes * 100) : 0
      linhasUsuarios += `<tr style="background: rgba(255,255,255,0.02);"><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.userName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.totalEquipamentos}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${userStat.totalInspecoes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #53D769; font-size: 14px; font-weight: 600;">${userStat.aprovadas}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FC3D39; font-size: 14px; font-weight: 600;">${userStat.reprovadas}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFCC00; font-size: 14px; font-weight: 600;">${userStat.pendentes}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px;">${Math.round(taxaAprovacaoUser)}%</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FC3D39; font-size: 14px; font-weight: 600;">${userStat.pendenciasArrastando}</td><td style="padding: 12px 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #FFCC00; font-size: 14px; font-weight: 600;">${userStat.equipamentosNaoInspecionados}</td></tr>`
    }
    if (userStatsForDev.length > 20) {
      linhasUsuarios += `<tr><td colspan="9" style="text-align: center; color: #8E8E93; padding: 20px;">... e mais ${userStatsForDev.length - 20} usuários (mostrando apenas os primeiros 20)</td></tr>`
    }
    tabelaUsuariosHTML = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.7) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-top: 30px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);"><thead><tr style="background: rgba(28,28,30,0.6);"><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Usuário</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Equipamentos</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Inspeções</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Aprovadas</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Reprovadas</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Pendentes</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Taxa Aprovação</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Pendências</th><th style="padding: 15px; text-align: left; color: #fff; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1);">Não Inspecionados</th></tr></thead><tbody>${linhasUsuarios}</tbody></table>`
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard Mensal - ${mesAno}</title></head><body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a1a; max-width: 1400px; margin: 0 auto;"><tr><td style="padding: 40px; background: linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,81,213,0.15) 100%); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(0,122,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1);"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color: #fff; font-size: 42px; font-weight: 700; padding-bottom: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.3);">📆 Dashboard Mensal ISF IA</td></tr><tr><td style="color: rgba(255,255,255,0.7); font-size: 18px;">Relatório Consolidado - ${mesAno}</td></tr></table></td></tr><tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="16.66%" style="padding-right: 15px; vertical-align: top;">${card1}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${card2}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${card3}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${card4}</td><td width="16.66%" style="padding: 0 15px; vertical-align: top;">${card5}</td><td width="16.66%" style="padding-left: 15px; vertical-align: top;">${card6}</td></tr></table></td></tr><tr><td>${topEquipamentos}</td></tr><tr><td>${tabelaUsuariosHTML}</td></tr><tr><td style="padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 12px; text-align: center;"><p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p><p>Relatório gerado automaticamente em ${dataGeracao}</p></td></tr></table></body></html>`
}

async function enviarEmailSMTP(html: string, dataInicio: string, dataFim: string, userEmail: string, userName?: string, isDevReport?: boolean): Promise<boolean> {
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
    const mesAno = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const emailDomain = EMAIL_FROM.includes('@') ? EMAIL_FROM.split('@')[1] : 'isfia.local'
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${emailDomain}>`
    
    const emailBody = [
      `From: ${EMAIL_FROM}`,
      `To: ${userEmail}`,
      `Subject: ${isDevReport ? '[DEV] ' : ''}Relatório Mensal de Inspeções - ISF IA${userName ? ` - ${userName}` : ''} - ${mesAno}`,
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
        await readResponse() // greeting2 - descartado após TLS
        const ehlo2 = await sendCommand(`EHLO ${SMTP_HOST}`)
        if (!ehlo2.includes('250')) {
          throw new Error(`SMTP EHLO after TLS failed: ${ehlo2}`)
        }
      } catch (tlsError: any) {
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
      try { 
        conn.close() 
      } catch {
        // Ignorar erro ao fechar conexão
      }
    }
    return false
  }
}

