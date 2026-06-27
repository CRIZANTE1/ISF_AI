import { captureException, captureMessage } from '../lib/sentry';

/**
 * Sistema centralizado de logging
 * Substitui console.log/error/warn por sistema estruturado
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = (import.meta as any).env?.DEV ?? true;
  private enabled = true;

  /**
   * Desabilita logging (útil para testes)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Habilita logging
   */
  enable() {
    this.enabled = true;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    if (!this.enabled) return;

    // Em desenvolvimento ou Android (sempre logar no console para debug)
    // No Android/Capacitor, console.log aparece no Logcat
    if (this.isDev || this.isAndroidNative()) {
      const prefix = context ? `[${context}]` : '';
      const logMessage = `${prefix} ${message}`;
      
      // No Android nativo, precisamos serializar objetos para evitar [object Object]
      const isAndroid = this.isAndroidNative();
      const formattedData = data && isAndroid ? this.serializeData(data) : (data || '');

      // Usar console.log como fallback se métodos específicos não estiverem disponíveis
      try {
        switch (level) {
          case 'debug':
            if (typeof console.debug === 'function') {
              console.debug(logMessage, formattedData);
            } else {
              console.log(`[DEBUG] ${logMessage}`, formattedData);
            }
            break;
          case 'info':
            if (typeof console.info === 'function') {
              console.info(logMessage, formattedData);
            } else {
              console.log(`[INFO] ${logMessage}`, formattedData);
            }
            break;
          case 'warn':
            if (typeof console.warn === 'function') {
              console.warn(logMessage, formattedData);
            } else {
              console.log(`[WARN] ${logMessage}`, formattedData);
            }
            break;
          case 'error':
            if (typeof console.error === 'function') {
              console.error(logMessage, formattedData);
            } else {
              console.log(`[ERROR] ${logMessage}`, formattedData);
            }
            break;
        }
      } catch (e) {
        // Fallback absoluto - sempre funciona
        console.log(`[${level.toUpperCase()}] ${logMessage}`, formattedData);
      }
    }

    if (level === 'error' && import.meta.env.PROD) {
      const nestedError =
        data instanceof Error
          ? data
          : data?.error instanceof Error
            ? data.error
            : null;

      if (nestedError) {
        captureException(nestedError, {
          logMessage: message,
          context,
          componentStack: data?.componentStack,
        });
      } else {
        captureMessage(message, {
          context,
          data: data instanceof Error
            ? { message: data.message, name: data.name, stack: data.stack }
            : data,
        });
      }
    }
  }

  /**
   * Verifica se está rodando em Android nativo (Capacitor)
   */
  private isAndroidNative(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const Capacitor = (window as any).Capacitor;
        return Capacitor.isNativePlatform && Capacitor.isNativePlatform();
      }
    } catch {
      // Ignorar erros
    }
    return false;
  }

  /**
   * Serializa dados para exibição no Android
   * Evita [object Object] no Logcat
   */
  private serializeData(data: any): string {
    if (!data) return '';
    
    try {
      // Se já é string, retorna
      if (typeof data === 'string') return data;
      
      // Se é um Error, extrai informações relevantes
      if (data instanceof Error) {
        return JSON.stringify({
          message: data.message,
          name: data.name,
          stack: data.stack,
        }, null, 2);
      }
      
      // Se é um objeto, tenta serializar com tratamento especial para erros
      if (typeof data === 'object') {
        // Cria uma versão serializada do objeto, tratando Errors aninhados
        const serialized = JSON.stringify(data, (key, value) => {
          if (value instanceof Error) {
            return {
              message: value.message,
              name: value.name,
              stack: value.stack,
            };
          }
          return value;
        }, 2);
        return serialized;
      }
      
      // Para tipos primitivos, converte para string
      return String(data);
    } catch (error) {
      // Se falhar a serialização, tenta uma abordagem mais simples
      try {
        return JSON.stringify(data);
      } catch {
        return String(data);
      }
    }
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: string, data?: any) {
    if (this.isDev) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data);
  }

  /**
   * Log de erro
   */
  error(message: string, context?: string, data?: any) {
    this.log('error', message, context, data);
  }
}

// Instância singleton
export const logger = new Logger();

// Exportar funções de conveniência
export const logDebug = (message: string, context?: string, data?: any) => {
  logger.debug(message, context, data);
};

export const logInfo = (message: string, context?: string, data?: any) => {
  logger.info(message, context, data);
};

export const logWarn = (message: string, context?: string, data?: any) => {
  logger.warn(message, context, data);
};

export const logError = (message: string, context?: string, data?: any) => {
  logger.error(message, context, data);
};

