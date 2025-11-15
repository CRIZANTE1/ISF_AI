/**
 * Hook simplificado para tratamento de erros com toast automático
 * 
 * Este hook combina o errorHandler com o ToastContext para facilitar
 * o tratamento de erros em componentes React.
 */

import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { processError, logError, handleAsyncError, ErrorContext, AppError } from '../utils/errorHandler';

/**
 * Hook para tratamento de erros com toast automático
 * 
 * @example
 * const { handleError, handleAsync } = useErrorHandler();
 * 
 * // Tratamento simples
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'equipment');
 * }
 * 
 * // Tratamento assíncrono
 * const { data, error } = await handleAsync(
 *   () => fetchEquipment(),
 *   'equipment'
 * );
 */
export const useErrorHandler = () => {
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  /**
   * Trata um erro e mostra toast automaticamente
   */
  const handleError = useCallback((
    error: unknown,
    context: ErrorContext = 'unknown',
    customMessage?: string
  ): AppError => {
    const appError = processError(error, context, customMessage);
    logError(appError);
    showError(appError.userMessage || appError.message);
    return appError;
  }, [showError]);

  /**
   * Trata uma operação assíncrona com tratamento de erro automático
   */
  const handleAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    context: ErrorContext = 'unknown',
    customErrorMessage?: string
  ): Promise<{ data: T | null; error: AppError | null }> => {
    return handleAsyncError(operation, context, showError, customErrorMessage);
  }, [showError]);

  /**
   * Executa uma operação e mostra sucesso/erro automaticamente
   */
  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    context: ErrorContext = 'unknown',
    successMessage?: string,
    customErrorMessage?: string
  ): Promise<T | null> => {
    const { data, error } = await handleAsync(operation, context, customErrorMessage);
    
    if (error) {
      return null;
    }
    
    if (successMessage && data !== null) {
      showSuccess(successMessage);
    }
    
    return data;
  }, [handleAsync, showSuccess]);

  return {
    handleError,
    handleAsync,
    executeWithFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

