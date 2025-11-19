/**
 * Sistema centralizado de tratamento de erros
 * 
 * Este utilitário fornece funções para tratar erros de forma consistente
 * em toda a aplicação, com logging estruturado e mensagens amigáveis ao usuário.
 */

import { useToast } from '../contexts/ToastContext';

export type ErrorContext = 
  | 'auth'
  | 'equipment'
  | 'inspection'
  | 'profile'
  | 'storage'
  | 'network'
  | 'validation'
  | 'permission'
  | 'unknown';

export interface AppError {
  message: string;
  context: ErrorContext;
  originalError?: unknown;
  code?: string;
  userMessage?: string;
}

/**
 * Mapeia erros do Supabase para mensagens amigáveis
 */
const getSupabaseErrorMessage = (error: any): string => {
  if (!error) return 'Ocorreu um erro desconhecido.';

  // Erros de rede
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') || 
      error.name === 'TypeError') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Erros de autenticação
  if (error.message?.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (error.message?.includes('Invalid API key')) {
    return 'Erro de configuração. Entre em contato com o suporte.';
  }

  if (error.message?.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de fazer login.';
  }

  if (error.message?.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }

  // Erros de permissão
  if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (error.code === 'PGRST116') {
    return 'Registro não encontrado.';
  }

  // Erros de validação
  if (error.code === '23505') { // Unique violation
    // Mensagem mais específica para extintores
    if (error.message?.includes('extintor') || error.message?.includes('numero_identificacao')) {
      return 'Não foi possível salvar a inspeção. Pode haver uma inspeção duplicada ou uma configuração incorreta no banco de dados. Tente novamente com uma data diferente.';
    }
    return 'Este registro já existe.';
  }

  if (error.code === '23503') { // Foreign key violation
    return 'Erro ao relacionar dados. Verifique as informações.';
  }

  // Erros de storage
  if (error.message?.includes('File size exceeds')) {
    return 'O arquivo é muito grande. Tamanho máximo: 5MB.';
  }

  if (error.message?.includes('Invalid file type')) {
    return 'Tipo de arquivo não permitido. Use apenas imagens (JPG, PNG, etc.).';
  }

  // Mensagem padrão do erro ou mensagem genérica
  return error.message || error.error_description || 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * Mapeia contexto para mensagens prefixadas
 */
const getContextualMessage = (context: ErrorContext, baseMessage: string): string => {
  const prefixes: Record<ErrorContext, string> = {
    auth: 'Erro de autenticação: ',
    equipment: 'Erro ao processar equipamento: ',
    inspection: 'Erro ao registrar inspeção: ',
    profile: 'Erro ao atualizar perfil: ',
    storage: 'Erro ao fazer upload: ',
    network: 'Erro de conexão: ',
    validation: 'Dados inválidos: ',
    permission: 'Sem permissão: ',
    unknown: '',
  };

  return prefixes[context] ? `${prefixes[context]}${baseMessage}` : baseMessage;
};

/**
 * Processa um erro e retorna um objeto AppError
 */
export const processError = (
  error: unknown,
  context: ErrorContext = 'unknown',
  customMessage?: string
): AppError => {
  let message = customMessage;
  let code: string | undefined;
  let originalError = error;

  if (error instanceof Error) {
    message = message || error.message;
    code = (error as any).code;
    originalError = error;
  } else if (typeof error === 'string') {
    message = message || error;
  } else if (error && typeof error === 'object') {
    const err = error as any;
    message = message || err.message || err.error_description || 'Erro desconhecido';
    code = err.code;
    originalError = err;
  } else {
    message = message || 'Ocorreu um erro desconhecido.';
  }

  // Se for erro do Supabase, obter mensagem amigável
  const friendlyMessage = getSupabaseErrorMessage(originalError as any);
  const contextualMessage = getContextualMessage(context, friendlyMessage);

  return {
    message: contextualMessage,
    context,
    originalError,
    code,
    userMessage: friendlyMessage,
  };
};

/**
 * Loga erro de forma estruturada
 * 
 * Em produção, isso pode ser integrado com serviços como Sentry
 */
export const logError = (error: AppError, additionalInfo?: Record<string, any>) => {
  // Verifica se está em ambiente Android/Capacitor
  const isAndroidNative = (() => {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const Capacitor = (window as any).Capacitor;
        return Capacitor.isNativePlatform && Capacitor.isNativePlatform();
      }
    } catch {
      // Ignorar erros
    }
    return false;
  })();

  const logData = {
    message: error.message,
    context: error.context,
    code: error.code,
    timestamp: new Date().toISOString(),
    // Informações do ambiente (com fallback seguro para Android)
    userAgent: typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'Android Native',
    url: typeof window !== 'undefined' && window.location ? window.location.href : 'capacitor://app',
    platform: isAndroidNative ? 'android' : 'web',
    ...additionalInfo,
  };

  // Em desenvolvimento ou Android (sempre logar para debug)
  // No Android, console.error aparece no Logcat
  if (import.meta.env.DEV || isAndroidNative) {
    try {
      console.error('🚨 Erro capturado:', logData);
      if (error.originalError) {
        console.error('Erro original:', error.originalError);
      }
    } catch (e) {
      // Fallback absoluto
      console.log('[ERROR] Erro capturado:', JSON.stringify(logData));
    }
  }

  // Em produção, pode integrar com serviço de monitoramento externo
  // TODO: Se necessário, integrar com serviço de monitoramento (ex: Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD) {
  //   // Enviar para serviço de monitoramento
  // }
};

/**
 * Função helper para tratamento de erros sem toast (para uso em utilitários)
 * 
 * NOTA: Para uso em componentes React, use o hook useErrorHandler de src/hooks/useErrorHandler.ts
 * que integra automaticamente com o ToastContext.
 * 
 * Uso:
 * const appError = handleErrorWithoutToast(error, 'equipment');
 */
export const handleErrorWithoutToast = (
  error: unknown,
  context: ErrorContext = 'unknown',
  customMessage?: string
): AppError => {
  const appError = processError(error, context, customMessage);
  logError(appError);
  return appError;
};

/**
 * Função helper para tratamento de erros em operações assíncronas
 * 
 * Uso:
 * const result = await handleAsyncError(
 *   () => someAsyncOperation(),
 *   'equipment',
 *   showError
 * );
 */
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext = 'unknown',
  showError?: (message: string) => void,
  customErrorMessage?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = processError(error, context, customErrorMessage);
    logError(appError);

    if (showError) {
      showError(appError.userMessage || appError.message);
    }

    return { data: null, error: appError };
  }
};

/**
 * Valida se um erro é de rede
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.name === 'TypeError'
    );
  }
  return false;
};

/**
 * Valida se um erro é de permissão
 */
export const isPermissionError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const err = error as any;
    return (
      err.code === 'PGRST301' ||
      err.message?.includes('permission denied') ||
      err.message?.includes('access denied')
    );
  }
  return false;
};

