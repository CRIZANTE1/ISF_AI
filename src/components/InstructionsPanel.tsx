import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronRight, Info, AlertCircle, HelpCircle, X } from 'lucide-react';
import { EquipmentInstructions, getInstructions } from '../constants/instructions';
import { useTranslation } from '../hooks/useTranslation';
import DOMPurify from 'dompurify';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface InstructionsPanelProps {
  equipmentType: string;
  className?: string;
}

// Função para sanitizar HTML usando DOMPurify
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
};

// Função para converter markdown básico para HTML
const markdownToHtml = (text: string): string => {
  if (!text) return '';
  
  // Primeiro, converter negrito **texto** para <strong>texto</strong>
  const html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Dividir em linhas preservando espaços iniciais para detectar indentação
  const lines = html.split('\n');
  
  const result: string[] = [];
  let currentList: string[] | null = null;
  let isNumberedList = false;
  let currentNestedList: string[] | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();
    if (!trimmed) continue;
    
    // Calcular indentação (espaços no início)
    const indent = originalLine.length - originalLine.trimStart().length;
    const line = trimmed;
    
    // Verificar se é uma lista numerada (1. item)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      // Se estávamos em uma lista não numerada, fechar ela
      if (currentList && !isNumberedList) {
        if (currentNestedList) {
          result.push(`<ul class="guide-list">${currentNestedList.join('')}</ul>`);
          currentNestedList = null;
        }
        result.push(`<ul class="guide-list">${currentList.join('')}</ul>`);
        currentList = [];
      }
      
      // Se estávamos em uma lista numerada e há uma sublista, fechar a sublista
      if (currentNestedList && currentList) {
        const lastIndex = currentList.length - 1;
        if (lastIndex >= 0) {
          currentList[lastIndex] = currentList[lastIndex].replace('</li>', '') + 
            `<ul class="guide-list">${currentNestedList.join('')}</ul></li>`;
        }
        currentNestedList = null;
      }
      
      // Iniciar ou continuar lista numerada
      if (!currentList) {
        currentList = [];
        isNumberedList = true;
      }
      
      currentList.push(`<li>${numberedMatch[2]}</li>`);
      continue;
    }
    
    // Verificar se é uma lista com marcadores (- item ou • item)
    const bulletMatch = line.match(/^[-•]\s+(.+)$/);
    if (bulletMatch) {
      // Se estávamos em uma lista numerada e há indentação (sublista)
      if (currentList && isNumberedList && indent > 2) {
        if (!currentNestedList) {
          currentNestedList = [];
        }
        currentNestedList.push(`<li>${bulletMatch[1]}</li>`);
        continue;
      }
      
      // Se estávamos em uma lista numerada sem indentação, fechar ela
      if (currentList && isNumberedList) {
        if (currentNestedList) {
          const lastIndex = currentList.length - 1;
          if (lastIndex >= 0) {
            currentList[lastIndex] = currentList[lastIndex].replace('</li>', '') + 
              `<ul class="guide-list">${currentNestedList.join('')}</ul></li>`;
          }
          currentNestedList = null;
        }
        result.push(`<ol class="guide-list">${currentList.join('')}</ol>`);
        currentList = [];
      }
      
      // Iniciar ou continuar lista com marcadores
      if (!currentList) {
        currentList = [];
        isNumberedList = false;
      }
      
      currentList.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    }
    
    // Se chegou aqui, não é uma lista
    // Fechar lista atual se existir
    if (currentList) {
      if (currentNestedList) {
        const lastIndex = currentList.length - 1;
        if (lastIndex >= 0) {
          currentList[lastIndex] = currentList[lastIndex].replace('</li>', '') + 
            `<ul class="guide-list">${currentNestedList.join('')}</ul></li>`;
        }
        currentNestedList = null;
      }
      const listTag = isNumberedList ? 'ol' : 'ul';
      result.push(`<${listTag} class="guide-list">${currentList.join('')}</${listTag}>`);
      currentList = null;
      isNumberedList = false;
    }
    
    // Adicionar como parágrafo
    if (line) {
      result.push(`<p>${line}</p>`);
    }
  }
  
  // Fechar lista se ainda estiver aberta
  if (currentList) {
    if (currentNestedList) {
      const lastIndex = currentList.length - 1;
      if (lastIndex >= 0) {
        currentList[lastIndex] = currentList[lastIndex].replace('</li>', '') + 
          `<ul class="guide-list">${currentNestedList.join('')}</ul></li>`;
      }
    }
    const listTag = isNumberedList ? 'ol' : 'ul';
    result.push(`<${listTag} class="guide-list">${currentList.join('')}</${listTag}>`);
  }
  
  return result.join('\n');
};

// Função helper para traduzir instruções
const translateInstructions = (instructions: EquipmentInstructions, equipmentType: string, t: (key: string) => string): EquipmentInstructions => {
  const translated: EquipmentInstructions = { ...instructions };
  
  // Usar o equipmentType diretamente como chave
  const guideKey = equipmentType;
  
  if (guideKey) {
    // Traduzir título do header
    const titleKey = `guides.${guideKey}.title`;
    if (t(titleKey) && t(titleKey) !== titleKey) {
      translated.header.title = t(titleKey);
    }
    const subtitleKey = `guides.${guideKey}.subtitle`;
    if (t(subtitleKey) && t(subtitleKey) !== subtitleKey) {
      translated.header.subtitle = t(subtitleKey);
    }
    
    // Traduzir guias
    if (translated.guide) {
      translated.guide = translated.guide.map((section) => {
        const sectionKey = section.title.toLowerCase();
        const translatedSection = { ...section };
        
        // Tentar traduzir baseado no título e conteúdo
        let titleKey: string | null = null;
        let contentKey: string | null = null;
        
        // Verificar diferentes padrões de título - ordem importa!
        // Primeiro verificar padrões mais específicos
        if (sectionKey.includes('você vê') || sectionKey.includes('you see') || sectionKey.includes('what you see') || sectionKey.includes('what do you see')) {
          titleKey = `guides.${guideKey}.whatYouSee`;
          contentKey = `guides.${guideKey}.whatYouSeeContent`;
        } else if (sectionKey.includes('inspeção') || sectionKey.includes('inspection')) {
          titleKey = `guides.${guideKey}.howToRegisterInspection`;
          contentKey = `guides.${guideKey}.howToRegisterInspectionContent`;
        } else if (sectionKey.includes('teste') || sectionKey.includes('test')) {
          titleKey = `guides.${guideKey}.howToRegisterTest`;
          contentKey = `guides.${guideKey}.howToRegisterTestContent`;
        } else if (sectionKey.includes('usar') || sectionKey.includes('use') || sectionKey.includes('how to use')) {
          titleKey = `guides.${guideKey}.howToUse`;
          contentKey = `guides.${guideKey}.howToUseContent`;
        } else if (sectionKey.includes('escanear') || sectionKey.includes('scan') || sectionKey.includes('how to scan')) {
          titleKey = `guides.${guideKey}.howToRegister`;
          contentKey = `guides.${guideKey}.howToRegisterContent`;
        } else if (sectionKey.includes('configurar') || sectionKey.includes('configure') || sectionKey.includes('how to configure')) {
          titleKey = `guides.${guideKey}.howToRegister`;
          contentKey = `guides.${guideKey}.howToRegisterContent`;
        } else if (sectionKey.includes('preencher') || sectionKey.includes('fill') || sectionKey.includes('how to fill')) {
          // Tentar howToRegister primeiro, depois howToRegisterEquipment
          if (t(`guides.${guideKey}.howToRegister`) && t(`guides.${guideKey}.howToRegister`) !== `guides.${guideKey}.howToRegister`) {
            titleKey = `guides.${guideKey}.howToRegister`;
            contentKey = `guides.${guideKey}.howToRegisterContent`;
          } else {
            titleKey = `guides.${guideKey}.howToRegisterEquipment`;
            contentKey = `guides.${guideKey}.howToRegisterEquipmentContent`;
          }
        } else if (sectionKey.includes('cadastrar') || sectionKey.includes('register')) {
          // Se contém "novo" ou "new", usar howToRegisterEquipment (para guides de inspeção)
          // Caso contrário, tentar howToRegister primeiro (para guides de add)
          if (sectionKey.includes('novo') || sectionKey.includes('new')) {
            // Para guides de inspeção que têm seção de cadastro
            titleKey = `guides.${guideKey}.howToRegisterEquipment`;
            contentKey = `guides.${guideKey}.howToRegisterEquipmentContent`;
          } else {
            // Para guides de add (add_extintor, etc)
            if (t(`guides.${guideKey}.howToRegister`) && t(`guides.${guideKey}.howToRegister`) !== `guides.${guideKey}.howToRegister`) {
              titleKey = `guides.${guideKey}.howToRegister`;
              contentKey = `guides.${guideKey}.howToRegisterContent`;
            } else {
              titleKey = `guides.${guideKey}.howToRegisterEquipment`;
              contentKey = `guides.${guideKey}.howToRegisterEquipmentContent`;
            }
          }
        }
        
        // Se não encontrou padrão específico, tentar traduções genéricas como fallback
        if (!titleKey) {
          // Tentar howToRegister como fallback genérico
          const fallbackTitleKey = `guides.${guideKey}.howToRegister`;
          const fallbackContentKey = `guides.${guideKey}.howToRegisterContent`;
          if (t(fallbackTitleKey) && t(fallbackTitleKey) !== fallbackTitleKey) {
            titleKey = fallbackTitleKey;
            contentKey = fallbackContentKey;
          }
        }
        
        // Aplicar traduções se encontradas
        if (titleKey && t(titleKey) && t(titleKey) !== titleKey) {
          translatedSection.title = t(titleKey);
        }
        
        if (contentKey && t(contentKey) && t(contentKey) !== contentKey) {
          translatedSection.content = t(contentKey);
        }
        
        return translatedSection;
      });
    }
    
    // Traduzir FAQ
    if (translated.faq) {
      translated.faq = translated.faq.map(item => {
        const questionKey = item.question.toLowerCase();
        const translatedItem = { ...item };
        
        // Tentar traduzir FAQ baseado no conteúdo
        const faqKey = questionKey.includes('frequência') || questionKey.includes('frequency')
          ? `guides.${guideKey}.faqFrequency`
          : questionKey.includes('foto') || questionKey.includes('photo')
          ? `guides.${guideKey}.faqPhoto`
          : questionKey.includes('acesso') || questionKey.includes('access')
          ? `guides.${guideKey}.faqAccessEquipment`
          : questionKey.includes('alertas') || questionKey.includes('alerts')
          ? `guides.${guideKey}.faqAlerts`
          : null;
        
        if (faqKey && t(faqKey) && t(faqKey) !== faqKey) {
          translatedItem.question = t(faqKey);
          const answerKey = faqKey.replace('faqFrequency', 'faqFrequencyAnswer')
                                  .replace('faqPhoto', 'faqPhotoAnswer')
                                  .replace('faqAccessEquipment', 'faqAccessEquipmentAnswer')
                                  .replace('faqAlerts', 'faqAlertsAnswer');
          if (t(answerKey) && t(answerKey) !== answerKey) {
            translatedItem.answer = t(answerKey);
          }
        }
        
        return translatedItem;
      });
    }
  }
  
  return translated;
};

const InstructionsPanel = ({ equipmentType, className = '' }: InstructionsPanelProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const rawInstructions = getInstructions(equipmentType);
  
  if (!rawInstructions) {
    return null;
  }
  
  const instructions = translateInstructions(rawInstructions, equipmentType, t);

  const handleOpenModal = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore
    }
    setIsModalOpen(false);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const getAlertIcon = (type?: string) => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-[#157EFB]" />;
      case 'success':
        return <AlertCircle size={20} className="text-[#53D769]" />;
      case 'warning':
        return <AlertCircle size={20} className="text-[#F59E0B]" />;
      default:
        return <Info size={20} className="text-[#157EFB]" />;
    }
  };

  const getAlertBgColor = (type?: string) => {
    switch (type) {
      case 'info':
        return 'rgba(21, 126, 251, 0.1)';
      case 'success':
        return 'rgba(83, 215, 105, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      default:
        return 'rgba(21, 126, 251, 0.1)';
    }
  };

  const getAlertBorderColor = (type?: string) => {
    switch (type) {
      case 'info':
        return 'rgba(21, 126, 251, 0.3)';
      case 'success':
        return 'rgba(83, 215, 105, 0.3)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.3)';
      default:
        return 'rgba(21, 126, 251, 0.3)';
    }
  };

  return (
    <>
      <div className={`mb-ios-6 ${className} relative`} style={{ zIndex: 1, position: 'relative' }}>
        <motion.button
          type="button"
          onClick={handleOpenModal}
          className="w-full flex items-center justify-between p-ios-4 rounded-ios-lg transition-all relative"
          style={{
            zIndex: 1,
            position: 'relative',
            backgroundColor: 'rgba(28, 28, 30, 0.8)',
            borderRadius: '16px',
          }}
          whileHover={{ backgroundColor: 'rgba(28, 28, 30, 0.9)' }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-ios-2">
            <HelpCircle size={20} className="text-[#157EFB]" />
            <span className="font-semibold text-white text-base">
              {instructions.header.title}
            </span>
          </div>
          <ChevronRight size={20} className="text-[#8E8E93]" />
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCloseModal}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
            style={{
              touchAction: 'manipulation',
              overflow: 'hidden',
              WebkitOverflowScrolling: 'touch',
              zIndex: 99999,
              position: 'fixed'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              className="rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              style={{
                backgroundColor: '#1C1C1E',
                border: '1px solid #38383A',
                zIndex: 100000,
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#38383A] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <HelpCircle className="text-[#157EFB]" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {instructions.header.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto flex-1 p-4">
                <div className="apple-card p-ios-4 relative"
                  style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.95)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
            {/* Subtitle */}
            {instructions.header.subtitle && (
              <p className="text-[#8E8E93] text-sm mb-ios-4">
                {instructions.header.subtitle}
              </p>
            )}

            {/* Alert */}
            {instructions.alert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-ios-4 p-ios-3 rounded-ios-lg border-l-4"
                style={{
                  backgroundColor: getAlertBgColor(instructions.alert.type),
                  borderLeftColor: getAlertBorderColor(instructions.alert.type),
                }}
              >
                <div className="flex items-start gap-ios-2">
                  {getAlertIcon(instructions.alert.type)}
                  <p
                    className="text-sm flex-1"
                    style={{ color: '#FFFFFF' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(instructions.alert.message) }}
                  />
                </div>
              </motion.div>
            )}

            {/* Methods */}
            {instructions.methods && (
              <div className="mb-ios-5">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  {instructions.methods.title}
                </h3>
                <div className="space-y-ios-3">
                  {instructions.methods.items.map((method, methodIndex) => (
                    <motion.div
                      key={methodIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: methodIndex * 0.1 }}
                      className="p-ios-3 rounded-ios-lg"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <h4 className="font-semibold text-white mb-ios-1">
                        {method.name}
                      </h4>
                      <p className="text-[#8E8E93] text-xs mb-ios-2">
                        {method.description}
                      </p>
                      <p className="text-[#8E8E93] text-xs mb-ios-2">
                        <strong>{t('guides.time')}</strong> {method.time}
                      </p>
                      <div className="mb-ios-2">
                        <p className="text-[#8E8E93] text-xs mb-ios-1">
                          <strong>{t('guides.idealFor')}</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-ios-1 ml-ios-2">
                          {method.idealFor.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-[#8E8E93] text-xs">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-ios-2">
                        <p className="text-[#8E8E93] text-xs mb-ios-1">
                          <strong>{t('guides.howItWorks')}</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-ios-1 ml-ios-2">
                          {method.howItWorks.map((step, stepIndex) => (
                            <li key={stepIndex} className="text-[#8E8E93] text-xs">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {method.advantages && (
                        <div>
                          <p className="text-[#8E8E93] text-xs mb-ios-1">
                            <strong>{t('guides.advantages')}</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-ios-1 ml-ios-2">
                            {method.advantages.map((item, advantageIndex) => (
                              <li key={advantageIndex} className="text-[#8E8E93] text-xs">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {method.requires && (
                        <p className="text-[#F59E0B] text-xs mt-ios-2">
                          <strong>{t('guides.requires')}</strong> {method.requires}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow */}
            {instructions.workflow && (
              <div className="mb-ios-5">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  {instructions.workflow.title}
                </h3>
                <motion.div
                  className="p-ios-3 rounded-ios-lg border-l-4"
                  style={{
                    backgroundColor: 'rgba(21, 126, 251, 0.1)',
                    borderLeftColor: '#157EFB',
                  }}
                >
                  <ol className="list-decimal list-inside space-y-ios-2 ml-ios-2">
                    {instructions.workflow.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-white text-sm">
                        <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(step) }} />
                      </li>
                    ))}
                  </ol>
                </motion.div>
              </div>
            )}

            {/* Guide Sections */}
            {instructions.guide && (
              <div className="mb-ios-5 space-y-ios-3">
                {instructions.guide.map((section, index) => {
                  const isExpanded = expandedSections[section.title] ?? section.expanded ?? false;
                  return (
                    <div key={index} className="w-full">
                      <motion.button
                        type="button"
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between p-ios-3 rounded-ios-lg transition-all"
                        style={{
                          backgroundColor: isExpanded
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-semibold text-white text-sm flex-1 text-left pr-ios-2">
                          {section.title}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-[#8E8E93] flex-shrink-0" />
                        ) : (
                          <ChevronDown size={18} className="text-[#8E8E93] flex-shrink-0" />
                        )}
                      </motion.button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-ios-2 w-full rounded-ios-lg overflow-hidden"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <div
                              className="instructions-content p-ios-3 w-full"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(section.content)) }}
                              style={{
                                fontSize: '14px',
                                lineHeight: '1.7',
                                color: '#E5E5E7',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                              }}
                            />
                            <style>{`
                              .instructions-content {
                                width: 100%;
                                max-width: 100%;
                                box-sizing: border-box;
                              }
                              .instructions-content p {
                                margin: 0 0 8px 0;
                                color: #E5E5E7;
                                line-height: 1.7;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                              }
                              .instructions-content p:last-child {
                                margin-bottom: 0;
                              }
                              .instructions-content strong {
                                color: #FFFFFF;
                                font-weight: 600;
                              }
                              .instructions-content ol.guide-list,
                              .instructions-content ul.guide-list {
                                margin: 12px 0;
                                padding-left: 24px;
                                color: #E5E5E7;
                                width: 100%;
                                max-width: 100%;
                                box-sizing: border-box;
                              }
                              .instructions-content li {
                                margin: 6px 0;
                                line-height: 1.7;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                                padding-left: 4px;
                              }
                              .instructions-content li ul.guide-list,
                              .instructions-content li ol.guide-list {
                                margin: 8px 0;
                                padding-left: 20px;
                              }
                              .instructions-content ol.guide-list {
                                list-style-type: decimal;
                              }
                              .instructions-content ul.guide-list {
                                list-style-type: disc;
                              }
                              .instructions-content p {
                                margin: 0 0 12px 0;
                              }
                              .instructions-content p:has(+ ol),
                              .instructions-content p:has(+ ul) {
                                margin-bottom: 8px;
                              }
                              .instructions-content br {
                                line-height: 1.7;
                              }
                            `}</style>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FAQ */}
            {instructions.faq && (
              <div className="mb-ios-4">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  {t('guides.faq')}
                </h3>
                <div className="space-y-ios-2">
                  {instructions.faq.map((item, index) => {
                    const isExpanded = expandedSections[`faq-${index}`] ?? false;
                    return (
                      <div key={index}>
                        <motion.button
                          type="button"
                          onClick={() => toggleSection(`faq-${index}`)}
                          className="w-full flex items-center justify-between p-ios-3 rounded-ios-lg transition-all text-left"
                          style={{
                            backgroundColor: isExpanded
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.05)',
                          }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-medium text-white text-sm flex-1">
                            {item.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={18} className="text-[#8E8E93] ml-ios-2 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={18} className="text-[#8E8E93] ml-ios-2 flex-shrink-0" />
                          )}
                        </motion.button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-ios-2 p-ios-3 rounded-ios-lg"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <div
                                className="text-[#8E8E93] text-sm"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                                style={{
                                  lineHeight: '1.6',
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

                  {/* Footer */}
                  {instructions.footer && (
                    <motion.div
                      className="mt-ios-4 p-ios-3 rounded-ios-lg border-l-4"
                      style={{
                        backgroundColor: 'rgba(83, 215, 105, 0.1)',
                        borderLeftColor: '#53D769',
                      }}
                    >
                      <p
                        className="text-white text-sm"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(instructions.footer) }}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer com botão de fechar */}
              <div className="p-4 border-t border-[#38383A] bg-[#2C2C2E] flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
                >
                  {t('common.close', { defaultValue: 'Fechar' })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstructionsPanel;

