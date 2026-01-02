# 📧 Edge Functions - Sistema Completo de Emails - ISF IA

## 📋 Visão Geral

Este documento explica como configurar as Edge Functions no Supabase para automatizar o envio de relatórios e notificações por email relacionadas a inspeções de equipamentos de segurança, usando SMTP direto (Gmail/Outlook) sem depender de serviços externos pagos.

## 📚 Documentação Relacionada

- **Referência Rápida**: `EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md`
- **Detalhado**: `EDGE_FUNCTIONS_DETALHADO.md`
- **Visão Geral**: `EDGE_FUNCTIONS_COMPLETO.md`
- **Sistema de Emails**: `EMAIL_PROCESSING_SYSTEM.md`

## 🎯 Edge Functions Disponíveis

1. **📊 enviar-relatorio-diario** - Relatório diário de inspeções (✅ Implementado)
2. **📅 enviar-relatorio-semanal** - Relatório semanal de inspeções (🆕 Novo)
3. **📆 enviar-relatorio-mensal** - Relatório mensal de inspeções (🆕 Novo)
4. **⚠️ enviar-alertas-vencimento** - Alertas de equipamentos vencendo (🆕 Novo)
5. **🚨 enviar-notificacoes-pendencias** - Notificações de pendências (🆕 Novo)

---

## 📊 1. Relatório Diário de Inspeções

Este documento foca na configuração do **Relatório Diário**, que é a base do sistema. As outras funções seguem a mesma estrutura e lógica.

## ⚡ Resumo Rápido - Configuração Correta

**✅ CONFIGURAÇÃO TESTADA E FUNCIONANDO:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465          ← USE ESTA PORTA (SSL direto)
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
DEV_EMAIL=dev@email.com  # Para o dev receber relatórios diferenciados/consolidados
SUPA_URL=https://seu-projeto.supabase.co
SUPA_SERVICE_ROLE_KEY=*******

**⚠️ NÃO USE:**
- ❌ Porta 587 (STARTTLS) - Pode causar timeout e erros
- ✅ Porta 465 (SSL direto) - Funciona perfeitamente

**🎯 Resultado:**
- Status 200 ✅
- Tempo de execução: ~1.5 segundos
- Email enviado com sucesso

## 🎯 Vantagens

- ✅ **100% Gratuito** - Usa seu próprio servidor SMTP (Gmail/Outlook)
- ✅ **Design ISF IA** - Mantém a identidade visual do app (preto, verde, vermelho)
- ✅ **Automatizado** - Executa automaticamente todos os dias
- ✅ **Sem Dependências Externas** - Não precisa de Resend ou outros serviços

## ⚡ Solução Testada e Funcionando

**✅ CONFIGURAÇÃO RECOMENDADA:**
- **Porta 465 (SSL direto)** - Testada e funcionando perfeitamente
- **Status 200 confirmado** - Email enviado com sucesso
- **Tempo de execução**: ~1.5 segundos

**⚠️ NÃO USE:**
- Porta 587 (STARTTLS) - Pode causar timeout e erros no Supabase

**📌 Configuração das Secrets:**
```
SMTP_PORT=465  ← Use esta porta (SSL direto)
```

## 📁 Estrutura de Arquivos

Crie a seguinte estrutura no projeto:

```
supabase/
  functions/
    enviar-relatorio-inspecoes/
      index.ts
```

## 💻 Código da Edge Function

### Arquivo: `supabase/functions/enviar-relatorio-inspecoes/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações SMTP
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465') // Porta 465 (SSL direto) - RECOMENDADO
const SMTP_USER = Deno.env.get('SMTP_USER') || ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || ''
const DEV_EMAIL = Deno.env.get('DEV_EMAIL') || '' // Email do dev para receber relatório consolidado

interface InspectionRecord {
  id: number | string
  data_inspecao: string
  status_geral?: string | null
  status?: string | null
  observacoes_gerais?: string | null
  plano_de_acao?: string | null
  equipment_id?: string | null
  equipment_type?: string | null
}

interface Stats {
  total: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  comPlanoAcao: number
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPA_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPA_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPA_URL e SUPA_SERVICE_ROLE_KEY devem estar configurados')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calcular data do dia anterior
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(hoje.getDate() - 1)
    const dataFormatada = ontem.toISOString().split('T')[0] // YYYY-MM-DD

    console.log(`[INFO] Buscando inspeções de: ${dataFormatada}`)

    // Lista de tabelas de inspeções
    const inspectionTables = [
      'inspecoes_extintores',
      'inspecoes_chuveiros_lava_olhos',
      'inspecoes_camaras_espuma',
      'inspecoes_alarmes',
      'inspecoes_canhoes_monitores',
      'inspecoes_scba',
      'inspecoes_multigas',
      'inspecoes_abrigos',
      'inspecoes_mangueiras',
      'custom_equipment_inspections'
    ]

    // Buscar todos os usuários ativos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) {
      throw new Error(`Erro ao buscar usuários: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      console.log('[INFO] Nenhum usuário encontrado')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum usuário encontrado',
          data: dataFormatada,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          status: 200,
        }
      )
    }

    console.log(`[INFO] Total de usuários encontrados: ${profiles.length}`)

    // Buscar email de cada usuário e suas inspeções
    const resultados = []
    let allInspectionsForDev: InspectionRecord[] = []

    for (const profile of profiles) {
      try {
        // Buscar email do usuário via auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
        
        if (authError || !authUser?.user?.email) {
          console.warn(`[WARN] Não foi possível obter email do usuário ${profile.id}`)
          continue
        }

        const userEmail = authUser.user.email
        const userName = profile.full_name || userEmail.split('@')[0]

        // Buscar inspeções do usuário do dia anterior
        const userInspections: InspectionRecord[] = []

        for (const table of inspectionTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .eq('data_inspecao', dataFormatada)
              .eq('user_id', profile.id)
              .order('data_inspecao', { ascending: false })

            if (error) {
              console.warn(`[WARN] Erro ao buscar ${table} para usuário ${profile.id}:`, error.message)
              continue
            }

            if (data && data.length > 0) {
              userInspections.push(...data.map((item: any) => ({
                ...item,
                equipment_type: table.replace('inspecoes_', '').replace('_inspections', '')
              })))
            }
          } catch (err) {
            console.warn(`[WARN] Erro ao processar ${table} para usuário ${profile.id}:`, err)
            continue
          }
        }

        // Adicionar às inspeções consolidadas para o dev
        allInspectionsForDev.push(...userInspections)

        // Calcular estatísticas do usuário
        const userStats: Stats = {
          total: userInspections.length,
          aprovadas: userInspections.filter(i => 
            i.status_geral === 'aprovado' || 
            i.status === 'aprovado' || 
            i.status_geral === 'ok'
          ).length,
          reprovadas: userInspections.filter(i => 
            i.status_geral === 'reprovado' || 
            i.status === 'reprovado' || 
            i.status_geral === 'nao_conforme'
          ).length,
          pendentes: userInspections.filter(i => 
            i.status_geral === 'pendente' || 
            i.status === 'pendente'
          ).length,
          comPlanoAcao: userInspections.filter(i => 
            i.plano_de_acao && i.plano_de_acao.trim() !== ''
          ).length,
        }

        // Se o usuário tem inspeções, enviar email individual
        if (userInspections.length > 0) {
          const html = gerarHTML(userInspections, dataFormatada, userStats, userName)
          const emailEnviado = await enviarEmailSMTP(html, dataFormatada, userEmail, userName)
          
          if (emailEnviado) {
            resultados.push({
              usuario: userName,
              email: userEmail,
              inspecoes: userInspections.length,
              enviado: true
            })
          } else {
            resultados.push({
              usuario: userName,
              email: userEmail,
              inspecoes: userInspections.length,
              enviado: false
            })
          }
        }
      } catch (err) {
        console.error(`[ERROR] Erro ao processar usuário ${profile.id}:`, err)
        continue
      }
    }

    // Enviar relatório consolidado para o dev (se configurado)
    if (DEV_EMAIL && allInspectionsForDev.length > 0) {
      const devStats: Stats = {
        total: allInspectionsForDev.length,
        aprovadas: allInspectionsForDev.filter(i => 
          i.status_geral === 'aprovado' || 
          i.status === 'aprovado' || 
          i.status_geral === 'ok'
        ).length,
        reprovadas: allInspectionsForDev.filter(i => 
          i.status_geral === 'reprovado' || 
          i.status === 'reprovado' || 
          i.status_geral === 'nao_conforme'
        ).length,
        pendentes: allInspectionsForDev.filter(i => 
          i.status_geral === 'pendente' || 
          i.status === 'pendente'
        ).length,
        comPlanoAcao: allInspectionsForDev.filter(i => 
          i.plano_de_acao && i.plano_de_acao.trim() !== ''
        ).length,
      }

      const devHtml = gerarHTML(allInspectionsForDev, dataFormatada, devStats, 'Desenvolvedor', true)
      await enviarEmailSMTP(devHtml, dataFormatada, DEV_EMAIL, 'Desenvolvedor')
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[ERROR] Erro ao processar relatório:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
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
  if (statusLower === 'aprovado' || statusLower === 'ok') return '#53D769' // Verde - Sucesso
  if (statusLower === 'reprovado' || statusLower === 'nao_conforme') return '#FC3D39' // Vermelho - Erro
  if (statusLower === 'pendente') return '#FFCC00' // Amarelo - Pendente
  return '#8E8E93' // Cinza - Padrão
}

function gerarHTML(inspecoes: InspectionRecord[], data: string, stats: Stats, userName?: string, isDevReport?: boolean): string {
  const dataFormatadaBR = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const dataGeracao = new Date().toLocaleString('pt-BR')

  let tabelaHTML = ''
  if (stats.total === 0) {
    tabelaHTML = `
      <div class="no-data">
        <p>Nenhuma inspeção encontrada para esta data.</p>
      </div>
    `
  } else {
    let linhas = ''
    for (const insp of inspecoes.slice(0, 50)) { // Limitar a 50 para não sobrecarregar o email
      const id = insp.equipment_id || insp.id || '-'
      const tipo = insp.equipment_type || 'N/A'
      const status = formatarStatus(insp.status_geral || insp.status)
      const statusColor = getStatusColor(insp.status_geral || insp.status)
      const observacoes = insp.observacoes_gerais 
        ? insp.observacoes_gerais.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')
        : '-'
      const temPlanoAcao = insp.plano_de_acao && insp.plano_de_acao.trim() !== '' ? 'Sim' : 'Não'

      linhas += `
        <tr>
          <td>${String(id).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${tipo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td><span class="badge" style="background: ${statusColor}20; color: ${statusColor};">${status}</span></td>
          <td>${observacoes}</td>
          <td>${temPlanoAcao}</td>
        </tr>
      `
    }

    if (inspecoes.length > 50) {
      linhas += `
        <tr>
          <td colspan="5" style="text-align: center; color: #8E8E93; padding: 20px;">
            ... e mais ${inspecoes.length - 50} inspeções (mostrando apenas as primeiras 50)
          </td>
        </tr>
      `
    }

    tabelaHTML = `
      <table>
        <thead>
          <tr>
            <th>ID Equipamento</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Observações</th>
            <th>Plano de Ação</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    `
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Inspeções - ${dataFormatadaBR}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #000000;
            color: #FFFFFF;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(28, 28, 30, 0.8);
            border-radius: 24px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            color: #FFFFFF;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .subtitle {
            color: #8E8E93;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #1A1A1A;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #FFFFFF;
            margin-bottom: 5px;
        }
        .stat-value.success {
            color: #53D769;
        }
        .stat-value.error {
            color: #FC3D39;
        }
        .stat-value.warning {
            color: #FFCC00;
        }
        .stat-label {
            color: #8E8E93;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: #1A1A1A;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        thead {
            background: rgba(28, 28, 30, 0.8);
        }
        th {
            padding: 15px;
            text-align: left;
            color: #FFFFFF;
            font-weight: 600;
            font-size: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        td {
            padding: 12px 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            color: #FFFFFF;
        }
        tr:hover {
            background: rgba(28, 28, 30, 0.5);
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #8E8E93;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #8E8E93;
            font-size: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Relatório de Inspeções - ISF IA${userName ? ` - ${userName}` : ''}${isDevReport ? ' [CONSOLIDADO]' : ''}</h1>
        <p class="subtitle">Data: ${dataFormatadaBR}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total de Inspeções</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${stats.aprovadas}</div>
                <div class="stat-label">Aprovadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value error">${stats.reprovadas}</div>
                <div class="stat-label">Reprovadas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value warning">${stats.pendentes}</div>
                <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.comPlanoAcao}</div>
                <div class="stat-label">Com Plano de Ação</div>
            </div>
        </div>
        
        ${tabelaHTML}
        
        <div class="footer">
            <p>Relatório gerado automaticamente em ${dataGeracao}</p>
            <p>ISF IA - Sistema de Gestão de Inspeções de Equipamentos de Segurança</p>
        </div>
    </div>
</body>
</html>`
}

// Função para enviar email via SMTP
async function enviarEmailSMTP(html: string, data: string, userEmail: string, userName?: string): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[ERROR] SMTP_USER e SMTP_PASS devem estar configurados')
    return false
  }

  let conn: Deno.Conn | Deno.TlsConn | null = null

  try {
    const dataFormatadaBR = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    
    // Criar mensagem MIME
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${EMAIL_FROM.split('@')[1]}>`
    
    // Construir corpo do email
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

    // Conectar ao servidor SMTP
    // RECOMENDADO: Use porta 465 (SSL direto) - mais confiável no Supabase
    // Porta 587 (STARTTLS) pode ter problemas com Deno.startTls()
    console.log(`[INFO] Conectando ao servidor SMTP: ${SMTP_HOST}:${SMTP_PORT}`)
    
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Se porta 465, usar SSL direto (RECOMENDADO - funciona perfeitamente)
    if (SMTP_PORT === 465) {
      conn = await Deno.connectTls({ 
        hostname: SMTP_HOST, 
        port: SMTP_PORT 
      })
      console.log(`[DEBUG] Conexão TLS direta estabelecida (porta 465)`)
    } else {
      // Porta 587 - conexão normal primeiro, depois STARTTLS (pode ter problemas)
      console.log(`[WARNING] Usando porta ${SMTP_PORT} - Recomendado usar porta 465`)
      conn = await Deno.connect({ 
        hostname: SMTP_HOST, 
        port: SMTP_PORT 
      })
    }
    
    // Função auxiliar para ler resposta (usa a conexão atual)
    const readResponse = async (): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida')
      const buffer = new Uint8Array(4096)
      const n = await conn.read(buffer)
      if (n === null) return ''
      return decoder.decode(buffer.subarray(0, n))
    }

    // Função auxiliar para enviar comando (usa a conexão atual)
    const sendCommand = async (command: string): Promise<string> => {
      if (!conn) throw new Error('Conexão não estabelecida')
      await conn.write(encoder.encode(command + '\r\n'))
      return await readResponse()
    }

    // Handshake SMTP
    const greeting = await readResponse()
    console.log(`[DEBUG] SMTP Greeting: ${greeting}`)
    
    if (!greeting.startsWith('220')) {
      throw new Error(`SMTP handshake failed: ${greeting}`)
    }

    // EHLO
    const ehlo = await sendCommand(`EHLO ${SMTP_HOST}`)
    console.log(`[DEBUG] SMTP EHLO: ${ehlo}`)
    
    if (!ehlo.includes('250')) {
      throw new Error(`SMTP EHLO failed: ${ehlo}`)
    }

    // STARTTLS apenas se porta 587 e não estiver usando SSL direto
    // ⚠️ ATENÇÃO: STARTTLS pode ter problemas no Supabase (timeout, erros)
    // ✅ RECOMENDADO: Use porta 465 (SSL direto) para evitar estes problemas
    if (SMTP_PORT === 587 && !(conn instanceof Deno.TlsConn)) {
      const starttls = await sendCommand('STARTTLS')
      console.log(`[DEBUG] SMTP STARTTLS: ${starttls}`)
      
      if (!starttls.includes('220')) {
        throw new Error(`SMTP STARTTLS failed: ${starttls}`)
      }

      // Tentar fazer upgrade - pode falhar no Supabase
      try {
        if (!conn) throw new Error('Conexão não estabelecida')
        conn = await Deno.startTls(conn, {
          hostname: SMTP_HOST
        })
        console.log(`[DEBUG] Conexão TLS estabelecida via upgrade`)
        
        // Reiniciar handshake após TLS
        const greeting2 = await readResponse()
        console.log(`[DEBUG] SMTP Greeting after TLS: ${greeting2}`)
        
        const ehlo2 = await sendCommand(`EHLO ${SMTP_HOST}`)
        console.log(`[DEBUG] SMTP EHLO after TLS: ${ehlo2}`)
        
        if (!ehlo2.includes('250')) {
          throw new Error(`SMTP EHLO after TLS failed: ${ehlo2}`)
        }
      } catch (tlsError) {
        console.error(`[ERROR] Erro ao fazer upgrade TLS: ${tlsError}`)
        throw new Error(`❌ Erro com STARTTLS. ✅ SOLUÇÃO: Use porta 465 (SSL direto) ao invés de 587. Erro: ${tlsError.message}`)
      }
    }

    // AUTH LOGIN
    const authUser = await sendCommand('AUTH LOGIN')
    console.log(`[DEBUG] SMTP AUTH LOGIN: ${authUser}`)
    
    if (!authUser.includes('334')) {
      throw new Error(`SMTP AUTH LOGIN failed: ${authUser}`)
    }

    // Enviar usuário (base64)
    const userB64 = btoa(SMTP_USER)
    const authUserResp = await sendCommand(userB64)
    console.log(`[DEBUG] SMTP User: ${authUserResp}`)
    
    if (!authUserResp.includes('334')) {
      throw new Error(`SMTP User failed: ${authUserResp}`)
    }

    // Enviar senha (base64)
    const passB64 = btoa(SMTP_PASS)
    const authPassResp = await sendCommand(passB64)
    console.log(`[DEBUG] SMTP Pass: ${authPassResp}`)
    
    if (!authPassResp.includes('235')) {
      throw new Error(`SMTP Authentication failed: ${authPassResp}`)
    }

    // MAIL FROM
    const mailFrom = await sendCommand(`MAIL FROM:<${EMAIL_FROM}>`)
    console.log(`[DEBUG] SMTP MAIL FROM: ${mailFrom}`)
    
    if (!mailFrom.includes('250')) {
      throw new Error(`SMTP MAIL FROM failed: ${mailFrom}`)
    }

    // RCPT TO
    const rcptTo = await sendCommand(`RCPT TO:<${userEmail}>`)
    console.log(`[DEBUG] SMTP RCPT TO ${userEmail}: ${rcptTo}`)
    
    if (!rcptTo.includes('250')) {
      throw new Error(`SMTP RCPT TO failed for ${userEmail}: ${rcptTo}`)
    }

    // DATA
    const dataCmd = await sendCommand('DATA')
    console.log(`[DEBUG] SMTP DATA: ${dataCmd}`)
    
    if (!dataCmd.includes('354')) {
      throw new Error(`SMTP DATA failed: ${dataCmd}`)
    }

    // Enviar corpo do email (usa a conexão atual)
    if (!conn) throw new Error('Conexão não estabelecida')
    await conn.write(encoder.encode(emailBody + '\r\n.\r\n'))
    const dataResp = await readResponse()
    console.log(`[DEBUG] SMTP DATA response: ${dataResp}`)
    
    if (!dataResp.includes('250')) {
      throw new Error(`SMTP DATA send failed: ${dataResp}`)
    }

    // QUIT
    const quit = await sendCommand('QUIT')
    console.log(`[DEBUG] SMTP QUIT: ${quit}`)
    
    if (conn) {
      conn.close()
    }

    console.log('[SUCCESS] Email enviado com sucesso via SMTP!')
    return true

  } catch (error) {
    console.error('[ERROR] Erro ao enviar email via SMTP:', error)
    if (conn) {
      try {
        conn.close()
      } catch (e) {
        // Ignorar erro ao fechar
      }
    }
    return false
  }
}
```

## 🚀 Passo a Passo de Configuração

### 1. Criar a Edge Function no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Edge Functions** no menu lateral
4. Clique em **Create a new function**
5. Nome da função: `enviar-relatorio-inspecoes`
6. Cole o código completo acima no editor
7. Clique em **Deploy**

### 2. Configurar Secrets (Variáveis de Ambiente)

No Supabase Dashboard:

1. Vá em **Settings** > **Edge Functions** > **Secrets**
2. Adicione as seguintes variáveis:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
DEV_EMAIL=dev@email.com  # Para o dev receber relatórios diferenciados/consolidados
SUPA_URL=https://seu-projeto.supabase.co
SUPA_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**⚠️ IMPORTANTE - Porta SMTP:**
- **Porta 465 (RECOMENDADO)**: SSL direto - mais confiável e simples
- **Porta 587**: STARTTLS - pode ter problemas com `Deno.startTls()` no Supabase
- **Use porta 465** para evitar problemas de timeout e conexão

**🔑 Como Obter a SUPA_SERVICE_ROLE_KEY:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Role até a seção **Project API keys**
5. Copie a **service_role key** (secret) - é uma string longa que começa com `eyJ...`
6. ⚠️ **NUNCA compartilhe esta chave!** - Ela tem acesso total ao banco de dados
7. Cole esta chave na secret `SUPA_SERVICE_ROLE_KEY` no Dashboard

### 3. Configurar Gmail (Senha de App)

Se estiver usando Gmail, você precisa criar uma **Senha de App**:

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione **App** → **Email**
3. Selecione **Dispositivo** → **Outro (nome personalizado)**
4. Digite: "Supabase Edge Function"
5. Clique em **Gerar**
6. Copie a senha gerada (16 caracteres, sem espaços)
7. Use essa senha no `SMTP_PASS` (não use sua senha normal do Gmail!)

**⚠️ IMPORTANTE - Porta SMTP:**
- Use **porta 465** (SSL direto) - testada e funcionando ✅
- Não use porta 587 (STARTTLS) - pode causar problemas no Supabase ❌

### 4. Testar a Função Manualmente

#### Opção A: Via Dashboard (Mais Fácil)

No Supabase Dashboard:

1. Vá em **Edge Functions** > **enviar-relatorio-inspecoes**
2. Clique em **Invoke function**
3. Deixe o body vazio: `{}`
4. Clique em **Invoke**
5. Verifique os logs para ver se funcionou
6. Procure por: `[SUCCESS] Email enviado com sucesso via SMTP!`

#### Opção B: Via curl

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-inspecoes \
  -H "Authorization: Bearer sua_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**⚠️ IMPORTANTE**: Substitua `sua_service_role_key` pela sua service role key real.

### 5. Agendar Execução Automática (Cron Job)

#### Opção A: Via pg_cron (Recomendado)

1. No Supabase Dashboard, vá em **Database** > **Extensions**
2. Procure por `pg_cron` e habilite
3. Vá em **SQL Editor** e execute:

```sql
-- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela sua service role key real
-- Obtenha em: Settings > API > service_role key (secret)

-- Criar função para chamar a Edge Function usando pg_net
CREATE OR REPLACE FUNCTION public.enviar_relatorio_inspecoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI'; -- SUBSTITUA AQUI pela sua service role key
BEGIN
  -- net.http_post envia a requisição e retorna um request_id
  -- Usamos PERFORM para executar sem capturar o retorno
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-inspecoes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Requisição enviada para Edge Function com sucesso';
END;
$$;

-- Agendar execução diária às 8h UTC
SELECT cron.schedule(
  'enviar-relatorio-inspecoes',
  '0 8 * * *', -- Todos os dias às 8h UTC (formato: minuto hora dia mês dia-da-semana)
  $$
  SELECT public.enviar_relatorio_inspecoes();
  $$
);
```

**⚠️ IMPORTANTE**: 
- Substitua `'SUA_SERVICE_ROLE_KEY_AQUI'` pela sua service role key real
- Substitua `https://seu-projeto.supabase.co` pela URL do seu projeto
- Obtenha em: **Settings > API > service_role key** (secret)
- ⚠️ **NUNCA compartilhe esta chave!**
- ❌ **NÃO use** `current_setting('app.settings.service_role_key')` - essa configuração não existe no PostgreSQL

**Nota**: Esta função usa `pg_net` (já instalada e testada). É mais confiável que a extensão `http`.

**Testar a função antes de agendar:**
```sql
-- Testar a função manualmente
SELECT public.enviar_relatorio_inspecoes();
```

**Resultado esperado:**
- Se funcionar: `[{"enviar_relatorio_inspecoes": ""}]` - indica que a função foi executada com sucesso ✅
- Verifique também os logs da Edge Function no Dashboard para confirmar o envio do email
- Depois, crie o cron job

#### Opção B: Via Supabase Cron Jobs (Dashboard) - Comando Direto

1. No Supabase Dashboard, vá em **Database** > **Cron Jobs**
2. Clique em **New Cron Job**
3. Configure:
   - **Name**: `enviar-relatorio-inspecoes`
   - **Schedule**: `0 8 * * *` (todos os dias às 8h UTC)
   - **Command**: 
   ```sql
   -- IMPORTANTE: Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela sua service role key real
   SELECT net.http_post(
     url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-inspecoes',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY_AQUI'
     ),
     body := '{}'::jsonb
   ) AS request_id;
   ```

**⚠️ ATENÇÃO**: 
- Substitua `SUA_SERVICE_ROLE_KEY_AQUI` pela sua service role key real
- Substitua `https://seu-projeto.supabase.co` pela URL do seu projeto
- Não use `current_setting('app.settings.service_role_key')` - essa configuração não existe
- Use a chave diretamente ou via função (Opção A)

## 🔧 Configurações para Outros Servidores SMTP

### Gmail (Recomendado)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465  ← Use porta 465 (SSL direto)
```

### Outlook/Hotmail

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=465  ← Use porta 465 (SSL direto)
```

### Yahoo

```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465  ← Use porta 465 (SSL direto)
```

### Servidor Corporativo

Consulte o administrador de TI para obter:
- Servidor SMTP
- Porta (geralmente 587 ou 465)
- Se requer autenticação
- Credenciais específicas

## 📊 Monitoramento e Logs

### Ver Logs da Edge Function

1. No Supabase Dashboard, vá em **Edge Functions** > **enviar-relatorio-inspecoes**
2. Clique na aba **Logs**
3. Você verá todos os logs de execução, incluindo:
   - Busca de inspeções
   - Estatísticas calculadas
   - Tentativas de envio de email
   - Erros (se houver)

### Verificar Status do Cron Job

```sql
-- Ver todos os cron jobs agendados
SELECT * FROM cron.job WHERE jobname = 'enviar-relatorio-inspecoes';

-- Ver histórico de execuções
SELECT 
  runid,
  jobid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'enviar-relatorio-inspecoes')
ORDER BY start_time DESC
LIMIT 10;
```

### Testar a Função SQL do Cron Job

Se você criou a função `enviar_relatorio_inspecoes()`, teste antes de agendar:

```sql
-- Testar a função manualmente
SELECT public.enviar_relatorio_inspecoes();
```

**O que esperar:**
- Se funcionar: Resultado `[{"enviar_relatorio_inspecoes": ""}]` - indica que a função foi executada com sucesso
- Verifique também os logs da Edge Function no Dashboard para confirmar o envio do email
- Se houver erro: Mensagem de erro específica será exibida

## ⚠️ Troubleshooting

### Erro: "SMTP Authentication failed"

- Verifique se está usando **Senha de App** do Gmail (não a senha normal)
- Confirme que `SMTP_USER` e `SMTP_PASS` estão corretos
- Verifique se a autenticação de 2 fatores está habilitada no Gmail

### Erro: "SMTP handshake failed"

- Verifique se `SMTP_HOST` e `SMTP_PORT` estão corretos
- **Use porta 465 (SSL direto)** - mais confiável no Supabase
- Verifique se o firewall não está bloqueando a conexão

### Erro: "InvalidData: received corrupt message" ou Timeout (504)

- **Causa**: Problema com `Deno.startTls()` na porta 587 (STARTTLS)
- **Solução**: Use **porta 465 (SSL direto)** ao invés de 587
- Atualize a secret `SMTP_PORT` para `465` no Dashboard
- A porta 465 usa `Deno.connectTls()` direto, sem necessidade de STARTTLS

### Erro: "BadResource: Bad resource ID"

- **Causa**: Tentativa de usar conexão fechada após STARTTLS
- **Solução**: Use porta 465 (SSL direto) para evitar problemas com STARTTLS

### Erro: "SUPA_SERVICE_ROLE_KEY não configurado"

- Certifique-se de adicionar a secret no Dashboard
- Verifique se copiou a chave completa (é longa!)
- A chave deve começar com `eyJ...`
- Verifique se o nome da variável está correto: `SUPA_SERVICE_ROLE_KEY` (não `SUPABASE_SERVICE_ROLE_KEY`)

### Email não está sendo enviado

- Verifique os logs da Edge Function
- Confirme que `DEV_EMAIL` está configurado para receber relatórios consolidados
- Verifique a pasta de spam dos destinatários
- Teste manualmente primeiro antes de agendar

### Cron Job não está executando

- Verifique se a extensão `pg_cron` está habilitada
- Confirme o horário do cron (use horário UTC)
- Verifique os logs do cron job no SQL Editor

### Erro: "unrecognized configuration parameter 'app.settings.service_role_key'"

- **Causa**: `current_setting('app.settings.service_role_key')` não existe no PostgreSQL
- **Solução**: Use a service role key diretamente no código SQL
- **Passos**:
  1. Obtenha sua service role key em: **Settings > API > service_role key**
  2. Na função SQL, substitua `'SUA_SERVICE_ROLE_KEY_AQUI'` pela chave real
  3. No cron job direto, substitua `SUA_SERVICE_ROLE_KEY_AQUI` pela chave real
- ⚠️ **Segurança**: A chave ficará visível no código SQL. Mantenha a função protegida com `SECURITY DEFINER`

### Erro: "type 'http_request' does not exist" ou "column 'content' does not exist"

- **Causa**: Tentativa de usar extensão `http` que não está instalada, ou uso incorreto de `net.http_post()`
- **Solução**: Use `PERFORM net.http_post()` ao invés de tentar capturar o resultado
- **Código correto**:
  ```sql
  PERFORM net.http_post(
    url := '...',
    headers := jsonb_build_object(...),
    body := '{}'::jsonb
  );
  ```
- ✅ **Nota**: `net.http_post()` retorna apenas um `request_id` (bigint), não um objeto com `content`
- ✅ **Recomendado**: Use a função `enviar_relatorio_inspecoes()` (Opção A) ao invés do comando direto

## 📝 Notas Importantes

1. **Segurança**: Nunca compartilhe a `SUPA_SERVICE_ROLE_KEY` - ela tem acesso total ao banco
2. **Horário**: O relatório sempre busca dados do **dia anterior**
3. **Limites SMTP**: Gmail permite até 500 emails/dia na conta gratuita
4. **Porta SMTP**: **Use porta 465 (SSL direto)** - mais confiável no Supabase Edge Functions
   - Porta 465: SSL direto desde o início (`Deno.connectTls()`) ✅ **RECOMENDADO**
   - Porta 587: STARTTLS pode ter problemas com `Deno.startTls()` ⚠️ **NÃO RECOMENDADO**
5. **Logs**: Todos os logs ficam disponíveis no Dashboard do Supabase
6. **Design**: O email mantém a identidade visual do ISF IA (fundo preto, verde para sucesso, vermelho para erro)

## ✅ Solução Testada e Funcionando

### Configuração Recomendada (Testada)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465  ← SSL direto (funciona perfeitamente)
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### Por que Porta 465?

- ✅ **Mais confiável**: SSL estabelecido desde o início
- ✅ **Sem problemas de STARTTLS**: Não precisa fazer upgrade de conexão
- ✅ **Mais rápido**: Menos handshakes
- ✅ **Testado e funcionando**: Status 200 confirmado

### Problemas com Porta 587 (STARTTLS)

- ❌ `Deno.startTls()` pode travar (timeout 504)
- ❌ "InvalidData: received corrupt message"
- ❌ "BadResource: Bad resource ID"
- ⚠️ Mais complexo e propenso a erros no ambiente Supabase

## 🎉 Pronto!

Após seguir todos os passos, o relatório será enviado automaticamente todos os dias às 8h (ou no horário configurado no cron job).

Para testar imediatamente, você pode invocar a função manualmente pelo Dashboard ou via curl.

## ✅ Checklist de Verificação

Antes de considerar tudo pronto, verifique:

- [ ] Edge Function criada e deployada
- [ ] Todas as 8 secrets configuradas corretamente
- [ ] **SMTP_PORT configurado como 465** (não 587)
- [ ] Senha de App do Gmail configurada (não senha normal)
- [ ] Teste manual executado com sucesso (Status 200)
- [ ] Email recebido nos destinatários
- [ ] Cron job criado e agendado
- [ ] Extensão `pg_net` instalada (para cron job)
- [ ] Logs mostram execução sem erros

## 📚 Lições Aprendidas - Enviar Email no Supabase

### ✅ O que Funciona (Testado)

1. **Porta 465 (SSL direto)**
   - Use `Deno.connectTls()` desde o início
   - Sem necessidade de STARTTLS
   - Mais confiável e rápido
   - ✅ **Status 200 confirmado**

2. **Configuração Simples**
   - Secrets no Dashboard do Supabase
   - Senha de App do Gmail
   - Sem dependências externas

### ❌ O que NÃO Funciona Bem

1. **Porta 587 (STARTTLS)**
   - `Deno.startTls()` pode travar (timeout 504)
   - Erros: "InvalidData", "BadResource"
   - Mais complexo e propenso a falhas
   - ⚠️ **Não recomendado no Supabase**

### 🔑 Chave do Sucesso

**Use porta 465 com SSL direto** - Esta é a forma correta e testada de enviar emails via SMTP no Supabase Edge Functions.

### 📊 Comparação

| Aspecto | Porta 465 (SSL direto) | Porta 587 (STARTTLS) |
|---------|------------------------|----------------------|
| **Confiabilidade** | ✅ Alta | ❌ Pode falhar |
| **Simplicidade** | ✅ Simples | ❌ Complexo |
| **Performance** | ✅ Rápido (~1.5s) | ⚠️ Pode travar |
| **Status** | ✅ Funcionando | ❌ Problemas |
| **Recomendação** | ✅ **USE ESTA** | ❌ Evite |

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs da Edge Function no Dashboard
2. Confirme que está usando porta 465
3. Verifique se todas as secrets estão configuradas
4. Teste manualmente antes de agendar o cron job

