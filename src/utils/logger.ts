/**
 * Sistema centralizado de logging
 * Substitui console.log/error/warn por sistema estruturado
 * 
 * Em produção, pode ser integrado com serviços como Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;
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

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    // Em desenvolvimento, log no console
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '';
      const logMessage = `${prefix} ${message}`;

      switch (level) {
        case 'debug':
          console.debug(logMessage, data || '');
          break;
        case 'info':
          console.info(logMessage, data || '');
          break;
        case 'warn':
          console.warn(logMessage, data || '');
          break;
        case 'error':
          console.error(logMessage, data || '');
          break;
      }
    }

    // Em produção, pode integrar com serviço de monitoramento externo
    // TODO: Se necessário, integrar com serviço de monitoramento (ex: Sentry, LogRocket, etc.)
    // if (this.isProd && level === 'error') {
    //   // Enviar para serviço de monitoramento
    // }
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

