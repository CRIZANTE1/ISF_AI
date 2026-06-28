/**
 * Utilitários para manipulação de datas com timezone correto
 */

import { logger } from './logger';

/**
 * Converte string de data para objeto Date, tratando corretamente datas com e sem timezone
 * Se a data não tem timezone, assume horário local
 */
export const parseInspectionDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  
  // Verifica se tem timezone no formato ISO (Z, +HH:MM, ou -HH:MM)
  // Exemplos: "2025-01-08T14:30:00Z", "2025-01-08T14:30:00+03:00", "2025-01-08T14:30:00-03:00"
  const hasTimezone = dateStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
  
  if (hasTimezone) {
    // Usa parsing padrão do JavaScript que entende timezone
    return new Date(dateStr);
  }
  
  // Se tem T mas não tem timezone, é datetime-local sem timezone
  // Exemplo: "2025-01-08T14:30"
  if (dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
    // Cria Date no timezone local do dispositivo
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  }
  
  // Se é só data (YYYY-MM-DD), criar com horário 00:00 local
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Converte datetime-local para ISO string preservando o timezone do dispositivo
 * @param datetimeLocal - String no formato YYYY-MM-DDTHH:mm (do input datetime-local)
 * @returns ISO string com timezone local (ex: 2025-01-08T14:30:00-03:00)
 */
export const convertDateTimeLocalToISOWithTimezone = (datetimeLocal: string): string => {
  if (!datetimeLocal) {
    return new Date().toISOString();
  }

  // Valida formato básico
  if (!datetimeLocal.includes('T') && !datetimeLocal.includes('-')) {
    logger.warn('Formato de data inválido, usando data atual', 'dateUtils', { datetimeLocal });
    return new Date().toISOString();
  }

  try {
    // Parse da string datetime-local
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = (timePart || '00:00').split(':').map(Number);

    // Valida valores
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      logger.warn('Valores de data inválidos, usando data atual', 'dateUtils', { year, month, day, hour, minute });
      return new Date().toISOString();
    }

    // Cria Date no timezone local do dispositivo
    // new Date(year, month, day, hour, minute) cria uma data no timezone local
    const localDate = new Date(year, month - 1, day, hour, minute, 0);

    // Verifica se a data é válida
    if (isNaN(localDate.getTime())) {
      logger.warn('Data inválida após conversão, usando data atual', 'dateUtils');
      return new Date().toISOString();
    }

    // Obtém offset do timezone em minutos
    // getTimezoneOffset() retorna minutos de diferença do UTC
    // Positivo = atrás do UTC (ex: -03:00 = +180 minutos)
    // Negativo = à frente do UTC (ex: +05:00 = -300 minutos)
    const timezoneOffsetMinutes = localDate.getTimezoneOffset();
    
    // Calcula o offset em horas e minutos
    // Invertemos o sinal porque ISO usa o oposto (UTC-3 = -03:00, não +03:00)
    const offsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
    const offsetMinutes = Math.abs(timezoneOffsetMinutes) % 60;
    const offsetSign = timezoneOffsetMinutes > 0 ? '-' : '+'; // Invertido
    
    // Formata data/hora no formato ISO usando os valores locais
    const isoYear = localDate.getFullYear();
    const isoMonth = String(localDate.getMonth() + 1).padStart(2, '0');
    const isoDay = String(localDate.getDate()).padStart(2, '0');
    const isoHour = String(localDate.getHours()).padStart(2, '0');
    const isoMinute = String(localDate.getMinutes()).padStart(2, '0');
    const isoSecond = String(localDate.getSeconds()).padStart(2, '0');
    
    const timezoneStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    
    return `${isoYear}-${isoMonth}-${isoDay}T${isoHour}:${isoMinute}:${isoSecond}${timezoneStr}`;
  } catch (error) {
    logger.error('Erro ao converter datetime-local', 'dateUtils', { error });
    return new Date().toISOString();
  }
};

/**
 * Retorna data/hora atual no formato datetime-local (YYYY-MM-DDTHH:mm)
 */
export const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/**
 * Retorna ISO string com timezone local do dispositivo para o momento atual
 */
export const getCurrentLocalISOWithTimezone = (): string => {
  return convertDateTimeLocalToISOWithTimezone(getCurrentDateTimeLocal());
};

