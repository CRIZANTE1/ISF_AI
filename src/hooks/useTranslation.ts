import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Hook customizado para tradução
 * Facilita o uso do i18next com tipos e helpers
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * Muda o idioma da aplicação
   */
  const changeLanguage = async (lng: 'pt-BR' | 'en-US') => {
    await i18n.changeLanguage(lng);
    // Salva no localStorage automaticamente (via i18next config)
  };

  /**
   * Obtém o idioma atual
   */
  const currentLanguage = i18n.language || 'pt-BR';

  /**
   * Verifica se está em português
   */
  const isPortuguese = currentLanguage.startsWith('pt');

  /**
   * Verifica se está em inglês
   */
  const isEnglish = currentLanguage.startsWith('en');

  return {
    t,
    changeLanguage,
    currentLanguage,
    isPortuguese,
    isEnglish,
    i18n,
  };
};

