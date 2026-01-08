/**
 * Utilitários para operações de extintores
 * Baseado nas funcionalidades do projeto Python ISF_IA_SUP
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

// Mapeamento de ações para plano de ação baseado em não conformidades
export const ACTION_MAP: Record<string, string> = {
  PINTURA: "Programar a repintura corretiva do extintor.",
  MANÔMETRO: "Realizar a substituição imediata do manômetro.",
  MANOMETRO: "Realizar a substituição imediata do manômetro.",
  GATILHO: "Realizar a substituição do conjunto de gatilho.",
  VÁLVULA: "Verificar e/ou substituir o conjunto da válvula.",
  VALVULA: "Verificar e/ou substituir o conjunto da válvula.",
  MANGOTE: "Realizar a substituição da mangueira/mangote.",
  MANGUEIRA: "Realizar a substituição da mangueira/mangote.",
  RECARGA: "Enviar o extintor para o processo de recarga.",
  RECARREGANDO: "Enviar o extintor para o processo de recarga.",
  LACRE: "Substituir lacre e verificar motivo da violação.",
  SINALIZAÇÃO: "Corrigir a sinalização de piso e/ou parede do equipamento.",
  SINALIZACAO: "Corrigir a sinalização de piso e/ou parede do equipamento.",
  SUPORTE: "Verificar e/ou substituir o suporte de parede/piso.",
  OBSTRUÇÃO: "Desobstruir o acesso ao equipamento e garantir visibilidade.",
  OBSTRUCAO: "Desobstruir o acesso ao equipamento e garantir visibilidade.",
  "DANO VISÍVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
  "DANO VISIVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
  VENCIDO: "Retirar de uso e enviar para manutenção (Nível 2 ou 3) imediatamente.",
  CORROSÃO: "Avaliar extensão da corrosão. Se superficial, limpar e pintar. Se profunda, reprovar equipamento.",
};

export interface EquipmentDates {
  data_proxima_inspecao?: string | null;
  data_proxima_manutencao_2_nivel?: string | null;
  data_proxima_manutencao_3_nivel?: string | null;
  data_ultimo_ensaio_hidrostatico?: string | null;
}

export interface InspectionRecord {
  aprovado_inspecao?: string;
  observacoes_gerais?: string;
}

export interface Extinguisher {
  id?: number;
  numero_identificacao: string;
  numero_selo_inmetro?: string;
  numero_serie?: string;
  tipo_agente?: string;
  capacidade?: number;
  marca_fabricante?: string;
  ano_fabricacao?: number;
  tipo_servico?: string;
  data_servico?: string;
  inspetor_responsavel?: string;
  empresa_executante?: string;
  data_proxima_inspecao?: string;
  data_proxima_manutencao_2_nivel?: string;
  data_proxima_manutencao_3_nivel?: string;
  data_ultimo_ensaio_hidrostatico?: string;
  aprovado_inspecao?: string;
  status_geral?: string; // 'aprovado', 'pendente', 'reprovado'
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_relatorio_pdf?: string;
  latitude?: number;
  longitude?: number;
  link_foto_nao_conformidade?: string;
  local_id?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Normaliza string removendo acentos e convertendo para maiúsculas
 */
function normalizeString(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

/**
 * Retorna lista de palavras-chave únicas do ACTION_MAP (sem duplicatas)
 * Remove variações com/sem acentos, mantendo apenas uma versão
 * Prefere versões com acentos e nomes mais descritivos
 */
export function getActionKeywords(): string[] {
  const keywords = Object.keys(ACTION_MAP);
  const normalized = new Map<string, string>();
  
  // Primeiro, coleta todas as palavras-chave e suas versões normalizadas
  for (const keyword of keywords) {
    const normalizedKey = normalizeString(keyword);
    
    // Se já existe uma versão, prefere a que tem acento ou é mais descritiva
    if (!normalized.has(normalizedKey)) {
      normalized.set(normalizedKey, keyword);
    } else {
      const existing = normalized.get(normalizedKey)!;
      // Prefere versão com acento ou mais longa
      if (keyword.length > existing.length || 
          (keyword.match(/[áàâãéêíóôõúç]/i) && !existing.match(/[áàâãéêíóôõúç]/i))) {
        normalized.set(normalizedKey, keyword);
      }
    }
  }
  
  // Retorna valores únicos ordenados alfabeticamente
  return Array.from(normalized.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Gera plano de ação baseado na aprovação e observações
 */
export function generateActionPlan(record: InspectionRecord): string {
  const aprovado = record.aprovado_inspecao?.trim() || '';
  const observacoes = record.observacoes_gerais || '';
  
  // Normaliza as observações para busca (remove acentos, converte para maiúsculas)
  const observacoesNormalizadas = normalizeString(observacoes);

  // Caso 1: Equipamento aprovado
  if (aprovado === "Sim") {
    return "Manter em monitoramento periódico.";
  }

  // Caso 2: Equipamento não aprovado
  if (aprovado === "Não") {
    // Ordena as palavras-chave por tamanho (mais longas primeiro) para melhor matching
    // Isso garante que "DANO VISIVEL" seja encontrado antes de apenas "DANO"
    const sortedKeywords = Object.keys(ACTION_MAP).sort((a, b) => b.length - a.length);
    
    // Busca ação específica no mapa usando normalização
    for (const keyword of sortedKeywords) {
      const keywordNormalizada = normalizeString(keyword);
      // Verifica se a palavra-chave está contida nas observações normalizadas
      if (observacoesNormalizadas.includes(keywordNormalizada)) {
        return ACTION_MAP[keyword];
      }
    }

    // Se nenhuma palavra-chave for encontrada, retorna ação genérica
    if (observacoes.trim()) {
      return `Analisar e corrigir a não conformidade reportada: '${observacoes.trim()}'`;
    } else {
      return "Equipamento reprovado. Avaliar não conformidade e tomar ação corretiva apropriada.";
    }
  }

  // Caso 3: Status indefinido
  return "N/A";
}

/**
 * Calcula as próximas datas de manutenção baseado no tipo de serviço
 */
export function calculateNextDates(
  serviceDateStr: string,
  serviceLevel: string,
  existingDates?: EquipmentDates
): EquipmentDates {
  if (!serviceDateStr) {
    return {};
  }

  try {
    const serviceDate = new Date(serviceDateStr);
    if (isNaN(serviceDate.getTime())) {
      logger.warn('Data de serviço inválida', 'equipment', { serviceDateStr });
      return {};
    }

    // Inicializa com datas existentes ou dicionário vazio
    const dates: EquipmentDates = existingDates ? { ...existingDates } : {};

    // Aplica regras de cálculo baseado no tipo de serviço
    if (serviceLevel === "Manutenção Nível 3") {
      // Renova todas as datas
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      dates.data_proxima_manutencao_2_nivel = addMonths(serviceDate, 12).toISOString().split('T')[0];
      dates.data_proxima_manutencao_3_nivel = addYears(serviceDate, 5).toISOString().split('T')[0];
      dates.data_ultimo_ensaio_hidrostatico = serviceDate.toISOString().split('T')[0];
    } else if (serviceLevel === "Manutenção Nível 2") {
      // Renova inspeção mensal e N2, preserva N3 se existir
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      dates.data_proxima_manutencao_2_nivel = addMonths(serviceDate, 12).toISOString().split('T')[0];
      // Não altera data_proxima_manutencao_3_nivel nem data_ultimo_ensaio_hidrostatico
    } else if (serviceLevel === "Inspeção" || serviceLevel === "Substituição") {
      // Renova apenas a inspeção mensal
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      // Preserva todas as outras datas
    }

    // Normaliza todas as datas
    const normalizedDates: EquipmentDates = {};
    for (const [key, value] of Object.entries(dates)) {
      if (value === null || value === undefined || value === '') {
        normalizedDates[key as keyof EquipmentDates] = null;
      } else if (typeof value === 'string') {
        // Valida e formata string de data
        try {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            normalizedDates[key as keyof EquipmentDates] = parsedDate.toISOString().split('T')[0];
          } else {
            normalizedDates[key as keyof EquipmentDates] = null;
          }
        } catch {
          normalizedDates[key as keyof EquipmentDates] = null;
        }
      } else {
        normalizedDates[key as keyof EquipmentDates] = null;
      }
    }

    return normalizedDates;
  } catch (error) {
    logger.error('Erro ao calcular datas', 'equipment', error);
    return {};
  }
}

/**
 * Adiciona meses a uma data
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adiciona anos a uma data
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Formata datas para exibição
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'N/A';
  }
}

/**
 * Verifica se uma data está vencida
 */
export function isDateExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
}

/**
 * Calcula dias até vencimento
 */
export function daysUntilExpiration(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Busca todos os extintores com dados da última inspeção
 */
export async function getAllExtinguishers(): Promise<Extinguisher[]> {
  try {
    // Obtém o ID do usuário autenticado primeiro
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar extintores', 'equipment');
      return [];
    }

    // Busca cadastros de extintores APENAS do usuário autenticado
    const { data: extinguishers, error: extError } = await supabase
      .from('extintores')
      .select('*')
      .eq('user_id', user.id)
      .order('numero_identificacao');

    if (extError) {
      logger.error('Erro ao buscar cadastros de extintores', 'equipment', extError);
      throw extError;
    }
    
    if (!extinguishers || extinguishers.length === 0) {
      return [];
    }

    // Tenta buscar última inspeção de cada extintor para obter as datas atualizadas
    try {

      // Busca última inspeção de cada extintor
      // Como o Supabase não suporta DISTINCT ON diretamente, vamos buscar todas e agrupar
      const { data: allInspections, error: inspError } = await supabase
        .from('inspecoes_extintores' as any)
        .select('numero_identificacao, data_proxima_inspecao, data_proxima_manutencao_2_nivel, data_proxima_manutencao_3_nivel, data_ultimo_ensaio_hidrostatico, aprovado_inspecao, status_geral, data_servico, latitude, longitude, created_at')
        .eq('user_id', user.id)
        .order('data_servico', { ascending: false })
        .order('created_at', { ascending: false });

      if (inspError) {
        // Se a tabela não existir ou houver erro, retorna apenas os cadastros
        // Isso permite que o sistema funcione mesmo se a migração não foi executada
        logger.warn('Erro ao buscar últimas inspeções de extintores (tabela pode não existir ainda)', 'equipment', inspError);
        return extinguishers as Extinguisher[];
      }

      // Log para debug: verifica se encontrou inspeções
      if (!allInspections || allInspections.length === 0) {
        logger.info(`Nenhuma inspeção encontrada para ${extinguishers.length} extintores cadastrados`, 'equipment');
      } else {
        logger.info(`Encontradas ${allInspections.length} inspeções para ${extinguishers.length} extintores`, 'equipment');
      }

      // Cria um mapa das últimas inspeções por número de identificação
      // Como já está ordenado por data_servico DESC e created_at DESC, a primeira de cada extintor é a mais recente
      const inspectionMap = new Map<string, any>();
      if (allInspections && Array.isArray(allInspections)) {
        allInspections.forEach((insp: any) => {
          if (insp && insp.numero_identificacao) {
            const numId = insp.numero_identificacao;
            // Mantém apenas a primeira (mais recente) inspeção de cada extintor
            if (!inspectionMap.has(numId)) {
              inspectionMap.set(numId, insp);
            }
          }
        });
      }

      // Mescla dados de cadastro com dados da última inspeção
      const extinguishersWithInspections = extinguishers.map((ext: any) => {
        if (!ext || !ext.numero_identificacao) return ext;
        
        const lastInspection = inspectionMap.get(ext.numero_identificacao);
        if (lastInspection) {
          // Prioriza dados da última inspeção sobre dados de cadastro
          return {
            ...ext,
            data_proxima_inspecao: lastInspection.data_proxima_inspecao || ext.data_proxima_inspecao || null,
            data_proxima_manutencao_2_nivel: lastInspection.data_proxima_manutencao_2_nivel || ext.data_proxima_manutencao_2_nivel || null,
            data_proxima_manutencao_3_nivel: lastInspection.data_proxima_manutencao_3_nivel || ext.data_proxima_manutencao_3_nivel || null,
            data_ultimo_ensaio_hidrostatico: lastInspection.data_ultimo_ensaio_hidrostatico || ext.data_ultimo_ensaio_hidrostatico || null,
            // IMPORTANTE: aprovado_inspecao e status_geral vêm sempre da última inspeção (não do cadastro)
            aprovado_inspecao: lastInspection.aprovado_inspecao || null,
            status_geral: lastInspection.status_geral || null,
            // Geolocalização vem da última inspeção
            latitude: lastInspection.latitude || ext.latitude || null,
            longitude: lastInspection.longitude || ext.longitude || null,
          };
        }
        // Se não tem inspeção, mantém dados do cadastro mas sem aprovado_inspecao e status_geral (pois não foi inspecionado ainda)
        return {
          ...ext,
          aprovado_inspecao: ext.aprovado_inspecao || null,
          status_geral: ext.status_geral || null, // Garante que status_geral seja null quando não há inspeção
        };
      });

      return extinguishersWithInspections as Extinguisher[];
    } catch (inspectionError) {
      // Se houver qualquer erro ao buscar inspeções, retorna apenas os cadastros
      logger.warn('Erro ao processar inspeções de extintores, retornando apenas cadastros', 'equipment', inspectionError);
      return extinguishers as Extinguisher[];
    }
  } catch (error) {
    logger.error('Erro ao buscar extintores', 'equipment', error);
    // Retorna array vazio em caso de erro crítico para não quebrar a aplicação
    return [];
  }
}

/**
 * Busca um extintor por ID (busca o cadastro)
 */
export async function getExtinguisherById(numeroIdentificacao: string): Promise<Extinguisher | null> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar extintor', 'equipment');
      return null;
    }

    // Busca extintor APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('extintores')
      .select('*')
      .eq('numero_identificacao', numeroIdentificacao)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as Extinguisher) || null;
  } catch (error) {
    logger.error('Erro ao buscar extintor', 'equipment', error);
    return null;
  }
}

/**
 * Busca a última inspeção de um extintor
 */
export async function getLastExtinguisherInspection(numeroIdentificacao: string, userId?: string): Promise<Extinguisher | null> {
  try {
    // Obtém o ID do usuário autenticado se não foi fornecido
    let authenticatedUserId = userId;
    if (!authenticatedUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        logger.warn('Usuário não autenticado ao buscar inspeção de extintor', 'equipment');
        return null;
      }
      authenticatedUserId = user.id;
    }

    // Sempre filtra por user_id para garantir isolamento
    const { data, error } = await supabase
      .from('inspecoes_extintores' as any)
      .select('*')
      .eq('numero_identificacao', numeroIdentificacao)
      .eq('user_id', authenticatedUserId)
      .order('data_servico', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as any) || null;
  } catch (error) {
    logger.error('Erro ao buscar última inspeção de extintor', 'equipment', error);
    return null;
  }
}

/**
 * Salva um novo extintor
 */
export async function saveNewExtinguisher(
  extinguisher: Omit<Extinguisher, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se já existe APENAS para este usuário
    const { data: existing, error: checkError } = await supabase
      .from('extintores')
      .select('numero_identificacao')
      .eq('numero_identificacao', extinguisher.numero_identificacao)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Extintor com ID '${extinguisher.numero_identificacao}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('extintores', extinguisher);
    
    if (!result.success) {
      throw new Error('Falha ao salvar extintor');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', extinguisher.numero_identificacao, {
        type: 'extintor',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar extintor', 'equipment', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de extintor
 */
export async function saveExtinguisherInspection(
  inspection: Omit<Extinguisher, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Gera plano de ação automaticamente se não foi fornecido ou se está vazio
    let planoDeAcao = inspection.plano_de_acao;
    
    if (!planoDeAcao || planoDeAcao.trim() === '' || planoDeAcao === 'N/A') {
      planoDeAcao = generateActionPlan({
        aprovado_inspecao: inspection.aprovado_inspecao,
        observacoes_gerais: inspection.observacoes_gerais,
      });
    }

    // Calcula próximas datas
    const existingDates: EquipmentDates = {
      data_proxima_manutencao_2_nivel: inspection.data_proxima_manutencao_2_nivel || null,
      data_proxima_manutencao_3_nivel: inspection.data_proxima_manutencao_3_nivel || null,
      data_ultimo_ensaio_hidrostatico: inspection.data_ultimo_ensaio_hidrostatico || null,
    };

    const nextDates = calculateNextDates(
      inspection.data_servico || new Date().toISOString().split('T')[0],
      inspection.tipo_servico || 'Inspeção',
      existingDates
    );

    // Converte null para undefined para compatibilidade com o tipo
    const cleanDates = Object.fromEntries(
      Object.entries(nextDates).map(([key, value]) => [key, value ?? undefined])
    );

    // Converte aprovado_inspecao para status_geral (formato usado no banco)
    let statusGeral: string | undefined;
    const aprovado = (inspection.aprovado_inspecao || '').trim();
    if (aprovado === 'Sim') {
      statusGeral = 'aprovado';
    } else if (aprovado === 'Não' || aprovado === 'Nao') {
      statusGeral = 'reprovado';
    } else if (aprovado === 'Pendente') {
      statusGeral = 'pendente';
    }
    // Se já tem status_geral definido, usa ele (prioridade)
    if (inspection.status_geral) {
      statusGeral = inspection.status_geral;
    }

    // Prepara dados da inspeção para a nova tabela inspecoes_extintores
    const inspectionData = {
      numero_identificacao: inspection.numero_identificacao,
      data_servico: inspection.data_servico || new Date().toISOString().split('T')[0],
      tipo_servico: inspection.tipo_servico || 'Inspeção',
      numero_selo_inmetro: inspection.numero_selo_inmetro, // Salva o selo do Inmetro (atualizado em manutenções nível 2 ou 3)
      inspetor_responsavel: inspection.inspetor_responsavel,
      empresa_executante: inspection.empresa_executante,
      aprovado_inspecao: inspection.aprovado_inspecao,
      status_geral: statusGeral, // Salva status_geral no formato do banco ('aprovado', 'pendente', 'reprovado')
      observacoes_gerais: inspection.observacoes_gerais,
      plano_de_acao: planoDeAcao,
      link_foto_nao_conformidade: inspection.link_foto_nao_conformidade,
      link_relatorio_pdf: inspection.link_relatorio_pdf,
      latitude: inspection.latitude,
      longitude: inspection.longitude,
      data_proxima_inspecao: cleanDates.data_proxima_inspecao,
      data_proxima_manutencao_2_nivel: cleanDates.data_proxima_manutencao_2_nivel,
      data_proxima_manutencao_3_nivel: cleanDates.data_proxima_manutencao_3_nivel,
      data_ultimo_ensaio_hidrostatico: cleanDates.data_ultimo_ensaio_hidrostatico,
      user_id: inspection.user_id,
    };

    // Verifica se já existe uma inspeção para esta data
    if (inspection.numero_identificacao && inspection.data_servico && inspection.user_id) {
      // Extrai apenas a data (YYYY-MM-DD) para comparação, funciona com date e timestamp
      const dateOnly = String(inspection.data_servico).split('T')[0];
      const startOfDay = `${dateOnly}T00:00:00`;
      const endOfDay = `${dateOnly}T23:59:59`;
      
      const { data: existing } = await supabase
        .from('inspecoes_extintores' as any)
        .select('id')
        .eq('numero_identificacao', inspection.numero_identificacao)
        .gte('data_servico', startOfDay)
        .lte('data_servico', endOfDay)
        .eq('user_id', inspection.user_id)
        .limit(1)
        .maybeSingle();
      
      if (existing && (existing as any).id) {
        // Inspeção já existe para esta data, atualiza ao invés de inserir
        logger.info('Inspeção já existe para esta data, atualizando registro existente', 'equipment', {
          numero_identificacao: inspection.numero_identificacao,
          data_servico: inspection.data_servico
        });

        // Obtém o ID do usuário autenticado para garantir isolamento
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser?.id) {
          throw new Error('Usuário não autenticado');
        }

        // Atualiza APENAS inspeções do usuário autenticado
        const { error: updateError } = await supabase
          .from('inspecoes_extintores' as any)
          .update(inspectionData)
          .eq('id', (existing as any).id)
          .eq('user_id', authUser.id);

        if (updateError) {
          throw updateError;
        }

        // Log action
        try {
          await logUserAction('update', 'inspection', inspection.numero_identificacao, {
            type: 'extintor',
            tipo_servico: inspection.tipo_servico,
            aprovado: inspection.aprovado_inspecao,
          });
        } catch (logError) {
          logger.error('Failed to log action', 'equipment', logError);
        }

        return true;
      }
    }

    // Usa wrapper offline para suportar modo offline
    // Agora usa a tabela inspecoes_extintores ao invés de extintores
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_extintores', inspectionData);
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.numero_identificacao, {
        type: 'extintor',
        tipo_servico: inspection.tipo_servico,
        aprovado: inspection.aprovado_inspecao,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de extintor', 'equipment', error);
    throw error;
  }
}

/**
 * Registra baixa de extintor
 */
export async function registerExtinguisherDisposal(
  numeroIdentificacao: string,
  motivoCondenacao: string,
  responsavelBaixa: string,
  numeroSubstituto?: string,
  observacoes?: string,
  linkFoto?: string
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se o extintor pertence ao usuário antes de registrar baixa
    const { data: extinguisher, error: checkError } = await supabase
      .from('extintores')
      .select('id')
      .eq('numero_identificacao', numeroIdentificacao)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (!extinguisher) {
      throw new Error('Extintor não encontrado ou não pertence ao usuário autenticado');
    }

    // Busca a última inspeção para obter as coordenadas GPS
    const { data: lastInspection } = await supabase
      .from('inspecoes_extintores' as any)
      .select('latitude, longitude')
      .eq('numero_identificacao', numeroIdentificacao)
      .eq('user_id', user.id)
      .order('data_servico', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latitude = lastInspection?.latitude;
    const longitude = lastInspection?.longitude;

    // Se houver substituto e coordenadas, transfere as coordenadas para o substituto
    if (numeroSubstituto && latitude != null && longitude != null) {
      try {
        // Busca a última inspeção do substituto para preservar suas coordenadas se já tiver
        const { data: substituteInspection } = await supabase
          .from('inspecoes_extintores' as any)
          .select('latitude, longitude')
          .eq('numero_identificacao', numeroSubstituto)
          .eq('user_id', user.id)
          .order('data_servico', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Só transfere se o substituto não tiver coordenadas próprias
        if (substituteInspection?.latitude == null || substituteInspection?.longitude == null) {
          // Cria uma nova inspeção para o substituto com as coordenadas transferidas
          const { error: transferError } = await supabase
            .from('inspecoes_extintores' as any)
            .insert({
              numero_identificacao: numeroSubstituto,
              data_servico: new Date().toISOString().split('T')[0],
              tipo_servico: 'Transferência de Localização',
              observacoes_gerais: `Coordenadas GPS transferidas do extintor ${numeroIdentificacao} (baixado)`,
              latitude: latitude,
              longitude: longitude,
              user_id: user.id,
            });

          if (transferError) {
            logger.warn('Erro ao transferir coordenadas para o substituto', 'equipment', transferError);
          } else {
            logger.info('Coordenadas GPS transferidas para o extintor substituto', 'equipment', {
              de: numeroIdentificacao,
              para: numeroSubstituto,
            });
          }
        }
      } catch (transferError) {
        logger.warn('Erro ao transferir coordenadas para o substituto', 'equipment', transferError);
      }
    }

    // Salva no log de baixa
    const { error: logError } = await supabase
      .from('log_baixa_extintores')
      .insert({
        numero_identificacao: numeroIdentificacao,
        motivo_condenacao: motivoCondenacao,
        responsavel_baixa: responsavelBaixa,
        numero_identificacao_substituto: numeroSubstituto || null,
        observacoes: observacoes || null,
        link_foto_evidencia: linkFoto || null,
        data_baixa: new Date().toISOString().split('T')[0],
        user_id: user.id,
      });

    if (logError) throw logError;

    // Marca o equipamento como baixado (atualiza o registro existente)
    const { error: updateError } = await supabase
      .from('extintores')
      .update({
        tipo_servico: 'Baixa Definitiva',
        data_servico: new Date().toISOString().split('T')[0],
        aprovado_inspecao: 'N/A',
        observacoes_gerais: `EQUIPAMENTO BAIXADO - ${motivoCondenacao}`,
        plano_de_acao: `BAIXADO DEFINITIVAMENTE - SUBSTITUTO: ${numeroSubstituto || 'AGUARDANDO'}`,
      })
      .eq('id', extinguisher.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    logger.error('Erro ao registrar baixa de extintor', 'equipment', error);
    return false;
  }
}
