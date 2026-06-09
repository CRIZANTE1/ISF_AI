/**
 * Sistema de sincronização offline
 * Sincroniza operações pendentes quando a conexão é restaurada
 */

import { supabase } from '../lib/supabase';
import {
  getPendingOperations,
  removePendingOperation,
  updateOperationRetry,
} from './offlineDB';
import { logger } from './logger';
import { offlineOperationSchema, getSchemaForTable, safeValidateData, tableNameSchema } from './validation/schemas';

const MAX_RETRIES = 5; // Aumentado para dar mais chances
const INITIAL_RETRY_DELAY = 1000; // 1 segundo inicial
const MAX_RETRY_DELAY = 30000; // 30 segundos máximo
const BATCH_SIZE = 10; // Processa até 10 operações em paralelo por tabela
const MAX_OPERATION_AGE_DAYS = 30; // Remove operações com mais de 30 dias

/**
 * ⚠️ RISCO CRÍTICO: Mapeamento Manual de Constraints Únicas
 * 
 * Esta função mapeia manualmente as restrições de unicidade (UNIQUE constraints)
 * do banco de dados Supabase. Se o esquema do banco mudar e este arquivo não for
 * atualizado, a sincronização offline pode:
 * - Falhar silenciosamente ao detectar duplicatas
 * - Gerar registros duplicados no banco
 * - Perder dados durante a sincronização
 * 
 * 📚 DOCUMENTAÇÃO COMPLETA:
 * Veja docs/UNIQUE_CONSTRAINTS_MAINTENANCE.md para instruções detalhadas sobre
 * como verificar e atualizar este mapeamento.
 * 
 * 🔍 QUERY RÁPIDA PARA VERIFICAR CONSTRAINTS:
 * Execute no Supabase SQL Editor:
 * ```sql
 * SELECT 
 *   tc.table_name, 
 *   kcu.column_name,
 *   tc.constraint_name
 * FROM information_schema.table_constraints tc
 * JOIN information_schema.key_column_usage kcu 
 *   ON tc.constraint_name = kcu.constraint_name
 * WHERE tc.constraint_type = 'UNIQUE'
 *   AND tc.table_schema = 'public'
 * ORDER BY tc.table_name, kcu.ordinal_position;
 * ```
 * 
 * 📋 STATUS DAS TABELAS (verificado em 2025-12-20):
 * ✅ Mapeadas: abrigos, conjuntos_autonomos, extintores, inventario_*, mangueiras, 
 *    custom_equipment, inspecoes_extintores
 * ✅ Verificadas (sem constraint UNIQUE): inspecoes_scba, inspecoes_multigas, 
 *    inspecoes_camaras_espuma, inspecoes_canhoes_monitores, inspecoes_chuveiros_lava_olhos,
 *    inspecoes_alarmes, inspecoes_abrigos
 * ❓ Não verificadas: inspecoes_mangueiras, equipment (tabela genérica)
 * 
 * Última atualização: 2025-12-20 (verificação completa via MCP Supabase)
 * @see docs/UNIQUE_CONSTRAINTS_MAINTENANCE.md
 */
function extractUniqueFields(table: string, data: any): Array<{ field: string; value: any }> {
  const fields: Array<{ field: string; value: any }> = [];
  
  // ⚠️ MAPEAMENTO MANUAL - DEVE SER ATUALIZADO QUANDO O SCHEMA MUDAR
  // Mapeamento de constraints únicas REAIS do banco (verificado via SQL em 2025-12-20)
  const uniqueConstraints: Record<string, string[]> = {
    // Tabelas de equipamentos - constraints simples (campo único)
    'abrigos': ['id_abrigo'],
    'conjuntos_autonomos': ['numero_serie_equipamento'],
    'inventario_alarmes': ['id_sistema'],
    'inventario_camaras_espuma': ['id_camara'],
    'inventario_canhoes_monitores': ['id_equipamento'],
    'inventario_chuveiros_lava_olhos': ['id_equipamento'],
    'inventario_multigas': ['id_equipamento'],
    'mangueiras': ['id_mangueira'],
    // Constraints compostas (múltiplos campos)
    'extintores': ['numero_identificacao', 'user_id'], // Composta
    'custom_equipment': ['equipment_type_id', 'id_equipamento', 'user_id'], // Composta
    'inspecoes_extintores': ['numero_identificacao', 'data_servico', 'user_id'], // Composta
    
    // ✅ VERIFICADO EM 2025-12-20: As seguintes tabelas de inspeção NÃO têm constraints UNIQUE no banco:
    // - inspecoes_scba (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_multigas (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_camaras_espuma (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_canhoes_monitores (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_chuveiros_lava_olhos (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_alarmes (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_abrigos (permite múltiplas inspeções para o mesmo equipamento/data)
    // - inspecoes_mangueiras (não verificada, mas provavelmente sem constraint)
    // Se constraints forem adicionadas no futuro, atualize este mapeamento.
  };
  
  // Busca constraints para a tabela
  const constraints = uniqueConstraints[table];
  
  if (!constraints || constraints.length === 0) {
    // ⚠️ TABELA NÃO MAPEADA - Usa heurística de campos comuns
    // Isso pode não detectar duplicatas corretamente se a constraint for diferente!
    logger.warn(
      `⚠️ TABELA NÃO MAPEADA em extractUniqueFields: ${table}. ` +
      `Usando heurística de campos comuns. ` +
      `Verifique se há constraints UNIQUE no banco e adicione ao mapeamento. ` +
      `Veja docs/UNIQUE_CONSTRAINTS_MAINTENANCE.md para instruções.`,
      'sync',
      {
        table,
        availableFields: Object.keys(data),
        hint: 'Execute a query SQL em docs/UNIQUE_CONSTRAINTS_MAINTENANCE.md para verificar constraints reais',
        risk: 'Sincronização pode falhar ao detectar duplicatas se a constraint real for diferente',
      }
    );
    
    // Tabela não mapeada - tenta campos comuns
    const commonUniqueFields = [
      'id', 
      'id_equipamento', 
      'id_sistema', 
      'id_camara', 
      'id_abrigo', 
      'id_mangueira', 
      'numero_serie_equipamento',
      'numero_serie',
    ];
    
    for (const field of commonUniqueFields) {
      if (data[field] !== undefined && data[field] !== null) {
        fields.push({ field, value: data[field] });
      }
    }
    
    return fields;
  }
  
  // Adiciona todos os campos da constraint (simples ou composta)
  let allFieldsPresent = true;
  for (const field of constraints) {
    if (data[field] !== undefined && data[field] !== null) {
      fields.push({ field, value: data[field] });
    } else if (field !== 'user_id') {
      // user_id é adicionado automaticamente, então não conta como ausente
      allFieldsPresent = false;
    }
  }
  
  // Se for constraint composta e algum campo está ausente, não pode verificar duplicata
  if (!allFieldsPresent && constraints.length > 1) {
    logger.warn(`Constraint composta para ${table} está incompleta`, 'sync', {
      requiredFields: constraints,
      presentFields: fields.map(f => f.field),
    });
  }
  
  return fields;
}

/**
 * Verifica se há conexão real com o Supabase
 */
async function checkSupabaseConnection(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    // Primeiro verifica se consegue fazer uma requisição HTTP simples
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;
    
    // Tenta fazer uma requisição HEAD para verificar se o servidor está acessível
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Qualquer resposta (mesmo erro HTTP) significa que há conexão
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Se for erro de abort (timeout) ou rede, não há conexão
      if (fetchError.name === 'AbortError' || 
          fetchError.message?.includes('fetch') ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('Failed to fetch')) {
        return false;
      }
      
      // Outros erros podem significar que há conexão mas há outro problema
      // Nesse caso, tenta uma query simples ao Supabase
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        // Se não houver erro de rede, considera conectado
        // Erros de autenticação/permissão não significam falta de conexão
        return error === null || (!error.message?.includes('fetch') && !error.message?.includes('network'));
      } catch (queryError) {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
async function checkAuthentication(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém o ID do usuário autenticado
 * @throws {Error} Se o usuário não estiver autenticado
 */
async function getAuthenticatedUserId(): Promise<string> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error('Erro ao verificar autenticação');
    }
    
    if (!session || !session.user) {
      throw new Error('Usuário não autenticado');
    }
    
    return session.user.id;
  } catch (error: any) {
    logger.error('Erro ao obter ID do usuário autenticado', 'sync', error);
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
}

/**
 * Valida que o user_id nos dados corresponde ao usuário autenticado
 * @param data Dados da operação que podem conter user_id
 * @param authenticatedUserId ID do usuário autenticado
 * @throws {Error} Se o user_id não corresponder ao usuário autenticado
 */
function validateUserOwnership(data: Record<string, unknown>, authenticatedUserId: string): void {
  // Se os dados contêm user_id, deve corresponder ao usuário autenticado
  if (data.user_id !== undefined && data.user_id !== null) {
    if (data.user_id !== authenticatedUserId) {
      logger.error('Tentativa de acesso não autorizado detectada', 'security', {
        dataUserId: data.user_id,
        authenticatedUserId,
      });
      throw new Error('Acesso negado: os dados não pertencem ao usuário autenticado');
    }
  }
}

/**
 * Executa uma operação pendente
 */
async function executeOperation(operation: any): Promise<boolean> {
    // Valida estrutura da operação
    const operationValidation = safeValidateData(offlineOperationSchema, operation);
    if (!operationValidation.success) {
      logger.error('Operação offline inválida', 'sync', { error: operationValidation.error, operation });
      throw new Error(`Operação inválida: ${operationValidation.error}`);
    }

    const { type, table, data } = operation;

    // Valida nome da tabela
    const tableValidation = tableNameSchema.safeParse(table);
    if (!tableValidation.success) {
      logger.error('Nome de tabela inválido', 'sync', { table, error: tableValidation.error });
      throw new Error(`Tabela inválida: ${table}`);
    }

    // Obtém o ID do usuário autenticado (também valida autenticação)
    const authenticatedUserId = await getAuthenticatedUserId();
    
    // Valida que o user_id nos dados corresponde ao usuário autenticado
    validateUserOwnership(data, authenticatedUserId);

    // Valida dados com schema específico da tabela
    const schema = getSchemaForTable(table);
    if (schema) {
      const dataValidation = safeValidateData(schema, data);
      if (!dataValidation.success) {
        logger.error('Dados da operação inválidos', 'sync', { 
          table, 
          error: dataValidation.error,
          data: JSON.stringify(data).substring(0, 200) // Log apenas primeiros 200 chars
        });
        throw new Error(`Dados inválidos para tabela ${table}: ${dataValidation.error}`);
      }
    }

    switch (type) {
      case 'create': {
        // Garante que o user_id está definido e correto para operações create
        const dataWithUserId = {
          ...data,
          user_id: authenticatedUserId,
        };
        
        // Type assertion seguro pois table foi validado com tableNameSchema
        const { data: result, error } = await supabase
          .from(table as any)
          .insert(dataWithUserId)
          .select();
        
        if (error) {
          // Trata erros específicos
          if (error.code === '23505') { // Violação de constraint única
            // Para extintores, permite múltiplas inspeções (histórico)
            // Se houver erro 23505 para extintores sem campos únicos identificados,
            // pode ser uma constraint única no banco que precisa ser ajustada
            // Para inspecoes_extintores, verifica se é realmente uma duplicata baseada em (numero_identificacao + data_servico + user_id)
            if (table === 'inspecoes_extintores') {
              const uniqueFields = extractUniqueFields(table, data);
              if (uniqueFields.length === 0 || !uniqueFields.some(f => f.field === 'numero_identificacao')) {
                // Verifica se já existe registro com mesmo numero_identificacao + data_servico + user_id
                if (data.numero_identificacao && data.data_servico) {
                  try {
                    // Extrai apenas a data (YYYY-MM-DD) para comparação, funciona com date e timestamp
                    const dateOnly = String(data.data_servico).split('T')[0];
                    const startOfDay = `${dateOnly}T00:00:00`;
                    const endOfDay = `${dateOnly}T23:59:59`;
                    
                    // Type assertion seguro pois table foi validado com tableNameSchema
                    const { data: existing, error: checkError } = await supabase
                      .from(table as any)
                      .select('id')
                      .eq('numero_identificacao', data.numero_identificacao)
                      .gte('data_servico', startOfDay)
                      .lte('data_servico', endOfDay)
                      .eq('user_id', authenticatedUserId)
                      .limit(1);
                    
                    if (!checkError && existing && existing.length > 0) {
                      logger.warn(`Inspeção de extintor já existe para esta data, removendo da fila`, 'sync', {
                        table,
                        numero_identificacao: data.numero_identificacao,
                        data_servico: data.data_servico
                      });
                      return true; // Considera sucesso pois a inspeção já existe
                    }
                  } catch (checkErr) {
                    logger.warn('Erro ao verificar inspeção duplicada de extintor', 'sync', checkErr);
                  }
                }
                // Se não conseguiu verificar, propaga o erro para que o usuário veja a mensagem real
                logger.error(`Erro de constraint única na tabela ${table} para extintor`, 'sync', {
                  error: error.message,
                  data: { numero_identificacao: data.numero_identificacao, data_servico: data.data_servico }
                });
                throw error; // Propaga o erro para tratamento adequado
              }
            }
            
            // Para outras tabelas ou quando há campos únicos identificados
            const uniqueFields = extractUniqueFields(table, data);
            if (uniqueFields.length > 0) {
              try {
                // Type assertion seguro pois table foi validado com tableNameSchema
                let checkQuery = supabase.from(table as any).select('id').limit(1);
                uniqueFields.forEach(({ field, value }) => {
                  checkQuery = checkQuery.eq(field, value);
                });
                
                // Sempre adiciona filtro user_id para segurança
                checkQuery = checkQuery.eq('user_id', authenticatedUserId);
                
                const { data: existing, error: checkError } = await checkQuery;
                
                if (!checkError && existing && existing.length > 0) {
                  logger.warn(`Registro duplicado na tabela ${table} já existe, removendo da fila`, 'sync', {
                    table,
                    fields: uniqueFields
                  });
                  return true; // Considera sucesso pois o registro já existe
                }
                
                // Se conseguiu verificar mas NÃO encontrou duplicata, o erro 23505 é suspeito
                if (!checkError) {
                  logger.error(`⚠️ ALERTA: Erro 23505 mas registro não encontrado na verificação!`, 'sync', {
                    table,
                    fields: uniqueFields,
                    originalError: error.message,
                    hint: 'Pode ser constraint composta ou campo não verificado. PROPAGAR ERRO.'
                  });
                  throw error; // PROPAGAR para que usuário veja o erro real
                }
              } catch (checkErr: any) {
                // Se checkErr for o error original (throw acima), propagar
                if (checkErr === error || checkErr.code === '23505') {
                  throw checkErr;
                }
                
                logger.warn('Erro ao verificar registro duplicado', 'sync', checkErr);
                // Continua apenas se for erro de verificação, não o erro original
              }
            }
            
            // Se não há campos únicos identificáveis, NÃO descarta silenciosamente
            // Isso evita perda de dados por erros de constraint não mapeadas
            logger.error(`⚠️ ERRO 23505 em ${table} sem campos únicos identificáveis. PROPAGAR.`, 'sync', {
              error: error.message,
              detail: error.details,
              hint: error.hint,
              data: Object.keys(data), // Apenas chaves para não logar dados sensíveis
            });
            throw error; // PROPAGAR para que usuário veja erro e possa reportar
          }
          throw error;
        }
        
        // Verifica se realmente inseriu
        if (!result || result.length === 0) {
          throw new Error('Insert não retornou dados');
        }
        
        return true;
      }
      case 'update': {
        const { id, user_id, ...updateData } = data;
        
        // Constrói query com filtros apropriados
        // Sempre adiciona filtro user_id para garantir que só atualiza dados do usuário autenticado
        // Type assertion seguro pois table foi validado com tableNameSchema
        const query = supabase
          .from(table as any)
          .update(updateData)
          .eq('id', id)
          .eq('user_id', authenticatedUserId);
        
        const { data: result, error } = await query.select();
        
        if (error) throw error;
        
        // Verifica se realmente atualizou
        if (!result || result.length === 0) {
          throw new Error('Update não afetou nenhum registro. Registro pode não existir ou não pertencer ao usuário.');
        }
        
        return true;
      }
      case 'delete': {
        const { id, user_id } = data;
        
        // Constrói query com filtros apropriados
        // Sempre adiciona filtro user_id para garantir que só deleta dados do usuário autenticado
        // Type assertion seguro pois table foi validado com tableNameSchema
        const query = supabase
          .from(table as any)
          .delete()
          .eq('id', id)
          .eq('user_id', authenticatedUserId);
        
        const { error } = await query;
        
        if (error) throw error;
        
        return true;
      }
      default:
        throw new Error(`Tipo de operação desconhecido: ${type}`);
    }
}

/**
 * Calcula delay de retry com backoff exponencial adaptativo
 * Considera o tipo de erro para ajustar o delay
 */
function calculateRetryDelay(retryCount: number, error: any): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
  
  // Ajusta delay baseado no tipo de erro
  let multiplier = 1;
  if (error?.message?.includes('timeout') || error?.message?.includes('network')) {
    multiplier = 1.5; // Erros de rede: delay maior
  } else if (error?.code === '23505') {
    multiplier = 0.5; // Duplicatas: delay menor (pode ser resolvido rapidamente)
  }
  
  const delay = Math.min(baseDelay * multiplier, MAX_RETRY_DELAY);
  return Math.max(delay, INITIAL_RETRY_DELAY); // Mínimo de 1 segundo
}

/**
 * Verifica se um erro é recuperável (deve tentar novamente)
 */
function isRecoverableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = (error.code || '').toString();
  
  // 1. Erros FATAIS (Hard Errors) - Nunca tentar novamente
  // 23505: Unique violation (se o tratamento especial falhou, não adianta retentar)
  // 23503: Foreign key violation (referência não existe)
  // 23502: Not null violation (dado obrigatório faltando)
  // 22P02: Invalid input syntax (tipo de dado errado)
  // 42501: RLS violation (permissão negada permanentemente para este usuário)
  // 42P01: Undefined table (tabela não existe)
  const hardErrors = ['23505', '23503', '23502', '22P02', '42501', '42P01'];
  
  if (hardErrors.includes(errorCode)) {
    return false;
  }
  
  // Padrões de texto para erros não recuperáveis
  const nonRecoverablePatterns = [
    'permission denied',
    'violates row-level security',
    'invalid input syntax',
    'violates foreign key',
    'violates not-null',
    'column does not exist',
    'relation does not exist',
    'value too long',
    'check constraint',
  ];
  
  if (nonRecoverablePatterns.some(pattern => errorMessage.includes(pattern))) {
    return false;
  }
  
  // 2. Erros RECUPERÁVEIS - Tentar novamente
  const recoverablePatterns = [
    // Erros de rede/fetch
    'fetch',
    'network',
    'timeout',
    'failed to fetch',
    'connection',
    'econnrefused',
    'etimedout',
    'socket',
    'offline',
    
    // Códigos/Status HTTP recuperáveis
    '408', // Request Timeout
    '429', // Too Many Requests
    '500', // Internal Server Error
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504', // Gateway Timeout
    'pgrst301', // PostgREST connection issues
  ];
  
  // Verifica status HTTP se disponível no objeto de erro
  if (error.status) {
    const status = parseInt(error.status);
    if (status === 429 || status === 408 || status >= 500) {
      return true;
    }
  }
  
  // Verifica padrões na mensagem ou código
  return recoverablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.toLowerCase().includes(pattern)
  );
}

/**
 * Agrupa operações por tabela para processamento ordenado
 * Removemos a separação por tipo para garantir que create/update/delete
 * sejam processados na ordem correta (temporal)
 */
function groupOperationsByTable(operations: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  
  for (const op of operations) {
    // Agrupa apenas por tabela, mantendo a ordem temporal entre tipos de operação
    const key = op.table;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(op);
  }
  
  return grouped;
}

/**
 * Processa um lote de operações sequencialmente
 * 
 * ALTERADO: Execução sequencial para garantir integridade
 * Antes usava Promise.allSettled (paralelo), o que podia causar
 * race conditions (ex: update executando antes do create).
 */
async function processBatch(
  batch: any[],
  totalOperations: number,
  offset: number,
  onProgress?: (current: number, total: number, operation: any) => void
): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];
  
  // Executa sequencialmente para garantir consistência
  for (let i = 0; i < batch.length; i++) {
    const operation = batch[i];
    
    if (onProgress) {
      onProgress(offset + i + 1, totalOperations, operation);
    }
    
    try {
      await executeOperation(operation);
      await removePendingOperation(operation.id);
      success++;
    } catch (error: any) {
      const errorMessage = error.message || error.code || 'Erro desconhecido';
      const newRetries = operation.retries + 1;
      
      // Verifica se é erro recuperável
      if (isRecoverableError(error) && newRetries < MAX_RETRIES) {
        await updateOperationRetry(operation.id, newRetries, errorMessage);
        failed++; // Conta como falha temporária
      } else {
        // Erro não recuperável ou excedeu tentativas
        if (newRetries >= MAX_RETRIES) {
          await removePendingOperation(operation.id); // Remove após muitas tentativas
        } else {
          await updateOperationRetry(operation.id, newRetries, errorMessage);
        }
        failed++;
        errors.push({
          id: operation.id,
          error: errorMessage,
        });
      }
    }
  }
  
  return { success, failed, errors };
}

/**
 * Sincroniza todas as operações pendentes com suporte a progresso
 */
export async function syncPendingOperations(
  onProgress?: (current: number, total: number, operation: any) => void
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  // Verifica autenticação primeiro (mais rápido)
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    throw new Error('Usuário não autenticado. Faça login para sincronizar.');
  }

  // Verifica conexão real com Supabase
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  const operations = await getPendingOperations();
  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors: Array<{ id: string; error: string }> = [];

  if (operations.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  logger.info(`Iniciando sincronização sequencial de ${operations.length} operação(ões)`, 'sync');

  // Remove operações muito antigas antes de sincronizar
  const maxAge = Date.now() - (MAX_OPERATION_AGE_DAYS * 24 * 60 * 60 * 1000);
  const validOperations = operations.filter(op => op.timestamp > maxAge);
  const removedOld = operations.length - validOperations.length;
  
  if (removedOld > 0) {
    logger.info(`Removendo ${removedOld} operação(ões) antiga(s) (>${MAX_OPERATION_AGE_DAYS} dias)`, 'sync');
    for (const oldOp of operations.filter(op => op.timestamp <= maxAge)) {
      await removePendingOperation(oldOp.id);
    }
  }

  // Filtra operações que excederam tentativas
  const operationsToSync = validOperations.filter(op => op.retries < MAX_RETRIES);
  const skippedFailed = validOperations.length - operationsToSync.length;
  
  if (skippedFailed > 0) {
    totalFailed += skippedFailed;
    for (const failedOp of validOperations.filter(op => op.retries >= MAX_RETRIES)) {
      allErrors.push({
        id: failedOp.id,
        error: `Máximo de tentativas excedido: ${failedOp.error || 'Erro desconhecido'}`,
      });
    }
  }

  if (operationsToSync.length === 0) {
    logger.info(`Nenhuma operação válida para sincronizar`, 'sync');
    return { success: totalSuccess, failed: totalFailed, errors: allErrors };
  }

  // Agrupa operações por tabela para processamento organizado
  // Mas processa CADA GRUPO ordenado por timestamp
  const grouped = groupOperationsByTable(operationsToSync);
  const totalToSync = operationsToSync.length;
  let processedCount = 0;
  
  // Processa cada tabela em sequência
  for (const [table, groupOps] of grouped) {
    logger.info(`Sincronizando ${groupOps.length} operação(ões) na tabela ${table}`, 'sync');
    
    // ORDENAÇÃO CRÍTICA: Garante ordem temporal correta (antigo -> novo)
    // Create (t1) -> Update (t2) deve ser respeitado
    groupOps.sort((a, b) => a.timestamp - b.timestamp);
    
    // Processa todas as operações da tabela sequencialmente
    const batchResult = await processBatch(groupOps, totalToSync, processedCount, onProgress);
    processedCount += groupOps.length;
    totalSuccess += batchResult.success;
    totalFailed += batchResult.failed;
    allErrors.push(...batchResult.errors);
    
    // Pequeno delay entre tabelas para não sobrecarregar
    if (grouped.size > 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  logger.info(`Sincronização concluída: ${totalSuccess} sucesso, ${totalFailed} falhas`, 'sync');

  return { success: totalSuccess, failed: totalFailed, errors: allErrors };
}

/**
 * Verifica se há operações pendentes
 */
export async function hasPendingOperations(): Promise<boolean> {
  const operations = await getPendingOperations();
  return operations.length > 0;
}

/**
 * Limpa operações que falharam múltiplas vezes
 */
export async function cleanFailedOperations(): Promise<number> {
  const operations = await getPendingOperations();
  const failedOperations = operations.filter((op) => op.retries >= MAX_RETRIES);
  let cleaned = 0;

  for (const operation of failedOperations) {
    await removePendingOperation(operation.id);
    cleaned++;
  }

  return cleaned;
}

