import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

/**
 * Detecta idioma e região do dispositivo
 * Usa múltiplas estratégias para melhor detecção
 */
const getDeviceLanguage = (): string => {
  try {
    // Estratégia 1: Intl API (mais preciso para região)
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (locale) {
        // Normalizar locale (ex: 'pt-BR', 'en-US', 'pt', 'en')
        const normalized = locale.toLowerCase();
        if (normalized.startsWith('pt')) return 'pt-BR';
        if (normalized.startsWith('en')) return 'en-US';
      }
    }

    // Estratégia 2: Navigator language (Android/iOS/Web)
    if (typeof navigator !== 'undefined') {
      // Prioriza navigator.languages (array completo)
      const languages = navigator.languages || [navigator.language];
      
      for (const lang of languages) {
        if (!lang) continue;
        const normalized = lang.toLowerCase();
        if (normalized.startsWith('pt')) return 'pt-BR';
        if (normalized.startsWith('en')) return 'en-US';
      }
    }

    // Estratégia 3: Timezone como fallback (regiões de fuso horário)
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Timezones brasileiros
        if (timezone && (
          timezone.includes('America/Sao_Paulo') ||
          timezone.includes('America/Fortaleza') ||
          timezone.includes('America/Manaus') ||
          timezone.includes('America/Recife') ||
          timezone.includes('America/Belem') ||
          timezone.includes('America/Campo_Grande') ||
          timezone.includes('America/Cuiaba') ||
          timezone.includes('America/Araguaina') ||
          timezone.includes('America/Maceio') ||
          timezone.includes('America/Bahia')
        )) {
          return 'pt-BR';
        }
        // Timezones dos EUA
        if (timezone && (
          timezone.includes('America/New_York') ||
          timezone.includes('America/Chicago') ||
          timezone.includes('America/Denver') ||
          timezone.includes('America/Los_Angeles') ||
          timezone.includes('America/Phoenix') ||
          timezone.startsWith('US/')
        )) {
          return 'en-US';
        }
      } catch {
        // Ignorar erros de timezone
      }
    }

    // Fallback padrão
    return 'pt-BR';
  } catch {
    return 'pt-BR';
  }
};

/**
 * Recupera idioma salvo ou detecta automaticamente do dispositivo
 * Prioridade: localStorage > dispositivo > fallback
 */
const getInitialLanguage = (): string => {
  try {
    // 1. Verifica se há idioma salvo pelo usuário
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('i18nextLng');
      if (saved && (saved === 'pt-BR' || saved === 'en-US')) {
        return saved;
      }
    }
  } catch {
    // Ignorar erros
  }
  
  // 2. Detecta automaticamente do dispositivo/região
  const detectedLang = getDeviceLanguage();
  return detectedLang;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR,
      },
      'en-US': {
        translation: enUS,
      },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    detection: {
      // Ordem de detecção: localStorage > dispositivo > navegador
      // A detecção automática já foi feita em getInitialLanguage()
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // Não usar detecção automática do plugin, já temos nossa própria
      checkWhitelist: false,
    },
    react: {
      useSuspense: false, // Evita problemas com lazy loading
    },
  });

export default i18n;

