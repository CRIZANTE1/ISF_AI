/**
 * Wrappers para operações de banco de dados
 * 
 * PRIORIDADE: Sempre tenta salvar ONLINE primeiro
 * BACKUP: Só salva offline se não houver conexão ou se houver erro de rede
 * 
 * Fluxo:
 * 1. Verifica se está online
 * 2. Se online → Tenta salvar no Supabase
 * 3. Se sucesso → Retorna sucesso
 * 4. Se erro de rede → Salva offline como backup
 * 5. Se offline → Salva offline diretamente
 */

import { supabase } from '../lib/supabase';
import { savePendingOperation } from './offlineDB';
import { syncPendingOperations } from './offlineSync';
import { logger } from './logger';
import { getSchemaForTable, safeValidateData, tableNameSchema, createPartialSchema } from './validation/schemas';

/**
 * Interface para erros de rede/conexão
 */
interface NetworkError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Interface para erros de autenticação
 */
interface AuthenticationError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Type guard para verificar se o erro é de rede/conexão
 */
function isNetworkError(error: unknown): error is NetworkError {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as Record<string, unknown>;
  const errorMessage = (err.message as string)?.toLowerCase() || '';
  const errorCode = (err.code as string) || '';
  
  return (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('failed to fetch') ||
    errorCode === 'PGRST301' || // PostgREST connection error
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND'
  );
}

/**
 * Type guard para verificar se o erro é de autenticação
 */
function isAuthenticationError(error: unknown): error is AuthenticationError {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as Record<string, unknown>;
  const errorMessage = (err.message as string)?.toLowerCase() || '';
  const errorCode = (err.code as string) || '';
  const statusCode = (err.status as number) || (err.statusCode as number);
  
  return (
    statusCode === 401 ||
    statusCode === 403 ||
    (errorCode === 'PGRST301' && errorMessage.includes('jwt')) ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('usuário não autenticado') ||
    errorMessage.includes('erro ao verificar autenticação')
  );
}

/**
 * Verifica conexão real com Supabase
 * Retorna true apenas se houver conexão válida (sem erros de rede, autenticação ou servidor)
 * Otimizado: verificação rápida com timeout curto (1s) para não bloquear operações
 */
async function isSupabaseOnline(): Promise<boolean> {
  // Verificação rápida: navigator.onLine (instantânea)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  
  // Verificação leve: tenta requisição HTTP simples com timeout curto (1 segundo)
  // Não bloqueia por muito tempo, mas verifica conexão real
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 segundo apenas
    
    try {
      // Verificação HTTP rápida (HEAD request)
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Se chegou aqui, há conexão HTTP básica
      // Agora verifica se consegue fazer uma query ao Supabase (com timeout)
      try {
        // Usa Promise.race para timeout na query do Supabase
        const queryPromise = supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        const timeoutPromise = new Promise<{ error: { message: string; code?: string } }>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 1000);
        });
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        // Se não houver erro, está conectado e autenticado
        if ('error' in result && result.error === null) return true;
        if ('error' in result) {
          const error = result.error;
          // Se for erro de rede, não está conectado
          if (isNetworkError(error)) return false;
          // Se for erro de autenticação, não está conectado (para operações que requerem auth)
          if (isAuthenticationError(error)) return false;
          // Outros erros: assume conectado (pode ser problema temporário)
          return true;
        }
        
        return true;
      } catch (queryError: unknown) {
        // Timeout ou erro na query: não está totalmente conectado
        if (queryError instanceof Error && queryError.message === 'Query timeout') {
          return false;
        }
        return false;
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      // Se for erro de abort (timeout) ou rede, não há conexão
      if (fetchError instanceof Error && (
        fetchError.name === 'AbortError' || 
        fetchError.message?.includes('fetch') ||
        fetchError.message?.includes('network') ||
        fetchError.message?.includes('Failed to fetch')
      )) {
        return false;
      }
      
      // Outros erros: assume conectado (pode ser problema temporário)
      return true;
    }
  } catch {
    // Qualquer exceção indica problema de conexão
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
  } catch (error: unknown) {
    logger.error('Erro ao obter ID do usuário autenticado', 'storage', error);
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
 * Wrapper para operações de criação
 */
export async function offlineInsert(
  table: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; offlineId?: string }> {
  // Armazena authenticatedUserId no escopo da função para reutilizar no catch
  let authenticatedUserId: string | undefined;
  let authFailed = false; // Flag para rastrear se a autenticação falhou
  
  try {
    // Valida nome da tabela
    const tableValidation = tableNameSchema.safeParse(table);
    if (!tableValidation.success) {
      logger.error('Nome de tabela inválido', 'storage', { table, error: tableValidation.error });
      throw new Error(`Tabela inválida: ${table}`);
    }

    // Obtém o ID do usuário autenticado e valida
    try {
      authenticatedUserId = await getAuthenticatedUserId();
    } catch (authError: unknown) {
      // Se falhar por erro de autenticação, marca flag e propaga
      if (isAuthenticationError(authError)) {
        authFailed = true;
        throw authError;
      }
      // Se for erro de rede, pode tentar novamente no fallback
      throw authError;
    }
    validateUserOwnership(data, authenticatedUserId);
    
    // Valida dados com schema específico da tabela
    const schema = getSchemaForTable(table);
    if (schema) {
      const dataValidation = safeValidateData(schema, data);
      if (!dataValidation.success) {
        logger.error('Dados inválidos para inserção', 'storage', { 
          table, 
          error: dataValidation.error,
          data: JSON.stringify(data).substring(0, 200)
        });
        throw new Error(`Dados inválidos para tabela ${table}: ${dataValidation.error}`);
      }
    }
    
    // Garante que o user_id está definido e correto
    const dataWithUserId = {
      ...data,
      user_id: authenticatedUserId,
    };
    
    // PRIORIDADE: Sempre tenta online primeiro
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Tenta inserir diretamente no Supabase (ONLINE - PRIORIDADE)
      // Type assertion seguro pois table foi validado com tableNameSchema
      const { error, data: result } = await supabase.from(table as any).insert(dataWithUserId).select();

      if (error) {
        // Tratamento especial para inspeções de extintores com erro de constraint única
        if (table === 'inspecoes_extintores' && error.code === '23505') {
          // Verifica se é realmente uma duplicata baseada em (numero_identificacao + data_servico + user_id)
          // Type assertion seguro pois sabemos que é uma inspeção de extintor
          const inspectionData = dataWithUserId as Record<string, unknown>;
          if (inspectionData.numero_identificacao && inspectionData.data_servico) {
            try {
              // Type assertion seguro pois table foi validado com tableNameSchema
              const { data: existing, error: checkError } = await supabase
                .from(table as any)
                .select('id')
                .eq('numero_identificacao', inspectionData.numero_identificacao)
                .eq('data_servico', inspectionData.data_servico)
                .eq('user_id', authenticatedUserId)
                .limit(1);
              
              if (!checkError && existing && existing.length > 0) {
                // Inspeção já existe para esta data, considera sucesso
                logger.warn('Inspeção de extintor já existe para esta data', 'storage', {
                  numero_identificacao: inspectionData.numero_identificacao,
                  data_servico: inspectionData.data_servico
                });
                return { success: true };
              }
            } catch (checkErr) {
              logger.warn('Erro ao verificar inspeção duplicada de extintor', 'storage', checkErr);
            }
          }
          // Se não encontrou duplicata real, pode ser constraint única incorreta no banco
          // Propaga o erro com mensagem mais clara
          logger.error('Erro de constraint única ao inserir inspeção de extintor', 'storage', {
            error: error.message,
            data: {
              numero_identificacao: inspectionData.numero_identificacao,
              data_servico: inspectionData.data_servico
            }
          });
          throw new Error(`Não foi possível salvar a inspeção. Pode haver uma inspeção duplicada para esta data ou uma configuração incorreta no banco de dados. Detalhes: ${error.message}`);
        }
        
        // BACKUP: Só salva offline se for erro de rede/conexão
        // Não salva offline se for erro de autenticação (não faz sentido)
        // Outros erros (validação, constraint, etc) são lançados normalmente
        if (isNetworkError(error) && !isAuthenticationError(error)) {
          logger.warn('Erro de conexão ao inserir online, salvando offline como backup', 'storage', error);
          const offlineId = await savePendingOperation('create', table, dataWithUserId);
          return { success: true, offlineId };
        }
        
        // Outros erros (validação, constraint, etc) devem ser lançados
        throw error;
      }

      // Verifica se realmente inseriu
      if (!result || result.length === 0) {
        throw new Error('Insert não retornou dados');
      }

      return { success: true };
    } else {
      // BACKUP: Sem conexão, salva offline
      const offlineId = await savePendingOperation('create', table, dataWithUserId);
      logger.info('Sem conexão, operação salva offline como backup', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: unknown) {
    // BACKUP: Se falhar online com erro de rede, tenta salvar offline como fallback
    // Não tenta salvar offline se o erro for de autenticação ou se já falhou autenticação antes
    if (authFailed || isAuthenticationError(error)) {
      // Se já falhou autenticação ou erro é de autenticação, não tenta salvar offline
      throw error;
    }
    
    // Verifica se é erro de rede e não de autenticação
    if (isNetworkError(error) && !isAuthenticationError(error)) {
      try {
        // Reutiliza authenticatedUserId se já foi obtido, senão tenta obter novamente
        // (pode ter falhado antes por erro de rede durante a obtenção inicial)
        if (!authenticatedUserId) {
          try {
            authenticatedUserId = await getAuthenticatedUserId();
          } catch (retryAuthError: unknown) {
            // Se falhar novamente ao obter user_id, não tenta salvar offline
            logger.error('Erro ao obter user_id para salvar offline', 'storage', retryAuthError);
            throw error; // Lança o erro original
          }
        }
        const dataWithUserId = {
          ...data,
          user_id: authenticatedUserId,
        };
        const offlineId = await savePendingOperation('create', table, dataWithUserId);
        logger.warn('Erro de rede ao inserir online, salvando offline como backup', 'storage', error);
        return { success: true, offlineId };
      } catch (offlineError: unknown) {
        // Se falhar ao salvar offline, lança o erro original
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error; // Lança o erro original
      }
    }
    throw error;
  }
}

/**
 * Wrapper para operações de atualização
 */
export async function offlineUpdate(
  table: string,
  id: string | number,
  data: Record<string, unknown>
): Promise<{ success: boolean; offlineId?: string }> {
  // Armazena authenticatedUserId no escopo da função para reutilizar no catch
  let authenticatedUserId: string | undefined;
  let authFailed = false; // Flag para rastrear se a autenticação falhou
  
  try {
    // Valida nome da tabela
    const tableValidation = tableNameSchema.safeParse(table);
    if (!tableValidation.success) {
      logger.error('Nome de tabela inválido', 'storage', { table, error: tableValidation.error });
      throw new Error(`Tabela inválida: ${table}`);
    }

    // Valida ID
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
      throw new Error('ID inválido para atualização');
    }

    // Obtém o ID do usuário autenticado e valida
    try {
      authenticatedUserId = await getAuthenticatedUserId();
    } catch (authError: unknown) {
      // Se falhar por erro de autenticação, marca flag e propaga
      if (isAuthenticationError(authError)) {
        authFailed = true;
        throw authError;
      }
      // Se for erro de rede, pode tentar novamente no fallback
      throw authError;
    }
    validateUserOwnership(data, authenticatedUserId);

    // Valida dados com schema específico da tabela (apenas campos que serão atualizados)
    const schema = getSchemaForTable(table);
    if (schema) {
      // Para update, valida apenas os campos presentes nos dados
      const dataValidation = safeValidateData(createPartialSchema(schema), data);
      if (!dataValidation.success) {
        logger.error('Dados inválidos para atualização', 'storage', { 
          table, 
          error: dataValidation.error,
          data: JSON.stringify(data).substring(0, 200)
        });
        throw new Error(`Dados inválidos para tabela ${table}: ${dataValidation.error}`);
      }
    }
    
    // PRIORIDADE: Sempre tenta online primeiro
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Tenta atualizar diretamente no Supabase (ONLINE - PRIORIDADE)
      // Remove user_id dos dados de atualização (não deve ser atualizado)
      const { user_id: _user_id, ...updateData } = data;
      
      // Sempre adiciona filtro user_id para garantir que só atualiza dados do usuário autenticado
      // Type assertion seguro pois table foi validado com tableNameSchema
      const query = supabase
        .from(table as any)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', authenticatedUserId);
      
      const { error, data: result } = await query.select();

      if (error) {
        // BACKUP: Só salva offline se for erro de rede/conexão
        // Não salva offline se for erro de autenticação
        if (isNetworkError(error) && !isAuthenticationError(error)) {
          logger.warn('Erro de conexão ao atualizar online, salvando offline como backup', 'storage', error);
          // Garante que o user_id está presente nos dados salvos
          const operationData = {
            id,
            ...data,
            user_id: authenticatedUserId,
          };
          const offlineId = await savePendingOperation('update', table, operationData);
          return { success: true, offlineId };
        }
        
        throw error;
      }

      // Verifica se realmente atualizou
      if (!result || result.length === 0) {
        throw new Error('Update não afetou nenhum registro');
      }

      return { success: true };
    } else {
      // BACKUP: Sem conexão, salva offline
      const operationData = {
        id,
        ...data,
        user_id: authenticatedUserId,
      };
      const offlineId = await savePendingOperation('update', table, operationData);
      logger.info('Sem conexão, operação de update salva offline como backup', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: unknown) {
    // BACKUP: Se falhar online com erro de rede, tenta salvar offline como fallback
    // Não tenta salvar offline se o erro for de autenticação ou se já falhou autenticação antes
    if (authFailed || isAuthenticationError(error)) {
      // Se já falhou autenticação ou erro é de autenticação, não tenta salvar offline
      throw error;
    }
    
    // Verifica se é erro de rede e não de autenticação
    if (isNetworkError(error) && !isAuthenticationError(error)) {
      try {
        // Reutiliza authenticatedUserId se já foi obtido, senão tenta obter novamente
        // (pode ter falhado antes por erro de rede durante a obtenção inicial)
        if (!authenticatedUserId) {
          try {
            authenticatedUserId = await getAuthenticatedUserId();
          } catch (retryAuthError: unknown) {
            // Se falhar novamente ao obter user_id, não tenta salvar offline
            logger.error('Erro ao obter user_id para salvar offline', 'storage', retryAuthError);
            throw error; // Lança o erro original
          }
        }
        const operationData = {
          id,
          ...data,
          user_id: authenticatedUserId,
        };
        const offlineId = await savePendingOperation('update', table, operationData);
        logger.warn('Erro de rede ao atualizar, salvando offline', 'storage', error);
        return { success: true, offlineId };
      } catch (offlineError: unknown) {
        // Se falhar ao salvar offline, lança o erro original
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Wrapper para operações de exclusão
 */
export async function offlineDelete(
  table: string,
  id: string | number,
  user_id?: string
): Promise<{ success: boolean; offlineId?: string }> {
  // Armazena authenticatedUserId no escopo da função para reutilizar no catch
  let authenticatedUserId: string | undefined;
  let authFailed = false; // Flag para rastrear se a autenticação falhou
  
  try {
    // Valida nome da tabela
    const tableValidation = tableNameSchema.safeParse(table);
    if (!tableValidation.success) {
      logger.error('Nome de tabela inválido', 'storage', { table, error: tableValidation.error });
      throw new Error(`Tabela inválida: ${table}`);
    }

    // Obtém o ID do usuário autenticado
    try {
      authenticatedUserId = await getAuthenticatedUserId();
    } catch (authError: unknown) {
      // Se falhar por erro de autenticação, marca flag e propaga
      if (isAuthenticationError(authError)) {
        authFailed = true;
        throw authError;
      }
      // Se for erro de rede, pode tentar novamente no fallback
      throw authError;
    }
    
    // Valida que o user_id fornecido corresponde ao usuário autenticado
    if (user_id && user_id !== authenticatedUserId) {
      logger.error('Tentativa de acesso não autorizado detectada', 'security', {
        providedUserId: user_id,
        authenticatedUserId,
      });
      throw new Error('Acesso negado: os dados não pertencem ao usuário autenticado');
    }
    
    // PRIORIDADE: Sempre tenta online primeiro
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Tenta deletar diretamente no Supabase (ONLINE - PRIORIDADE)
      // Sempre adiciona filtro user_id para garantir que só deleta dados do usuário autenticado
      // Type assertion seguro pois table foi validado com tableNameSchema
      const query = supabase
        .from(table as any)
        .delete()
        .eq('id', id)
        .eq('user_id', authenticatedUserId);
      
      const { error } = await query;

      if (error) {
        // BACKUP: Só salva offline se for erro de rede/conexão
        // Não salva offline se for erro de autenticação
        if (isNetworkError(error) && !isAuthenticationError(error)) {
          logger.warn('Erro de conexão ao deletar online, salvando offline como backup', 'storage', error);
          const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
          return { success: true, offlineId };
        }
        
        throw error;
      }

      return { success: true };
    } else {
      // BACKUP: Sem conexão, salva offline
      const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
      logger.info('Sem conexão, operação de delete salva offline como backup', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: unknown) {
    // BACKUP: Se falhar online com erro de rede, tenta salvar offline como fallback
    // Não tenta salvar offline se o erro for de autenticação ou se já falhou autenticação antes
    if (authFailed || isAuthenticationError(error)) {
      // Se já falhou autenticação ou erro é de autenticação, não tenta salvar offline
      throw error;
    }
    
    // Verifica se é erro de rede e não de autenticação
    if (isNetworkError(error) && !isAuthenticationError(error)) {
      try {
        // Reutiliza authenticatedUserId se já foi obtido, senão tenta obter novamente
        // (pode ter falhado antes por erro de rede durante a obtenção inicial)
        if (!authenticatedUserId) {
          try {
            authenticatedUserId = await getAuthenticatedUserId();
          } catch (retryAuthError: unknown) {
            // Se falhar novamente ao obter user_id, não tenta salvar offline
            logger.error('Erro ao obter user_id para salvar offline', 'storage', retryAuthError);
            throw error; // Lança o erro original
          }
        }
        const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
        logger.warn('Erro de rede ao deletar, salvando offline', 'storage', error);
        return { success: true, offlineId };
      } catch (offlineError: unknown) {
        // Se falhar ao salvar offline, lança o erro original
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Sincroniza operações pendentes (chamado automaticamente quando volta online)
 */
export async function syncWhenOnline(): Promise<void> {
  const isOnline = await isSupabaseOnline();
  if (isOnline) {
    try {
      await syncPendingOperations();
    } catch (error) {
      logger.error('Erro ao sincronizar', 'storage', error);
      throw error;
    }
  }
}

