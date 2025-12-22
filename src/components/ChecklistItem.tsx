/**
 * Componente reutilizável para um item de checklist
 */

import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

interface ChecklistItemProps {
  question: string;
  value?: string;
  onChange: (value: string) => void;
}

// Função helper para gerar chave de tradução baseada na pergunta
const getQuestionKey = (question: string): string => {
  // Normaliza caracteres especiais e converte para minúsculas
  return question
    .toLowerCase()
    // Normaliza caracteres especiais (en-dash, em-dash, etc.)
    .replace(/[–—]/g, '-')
    // Remove acentos e caracteres especiais, mantém apenas letras, números e hífens
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const ChecklistItem = ({ question, value, onChange }: ChecklistItemProps) => {
  const { t } = useTranslation();
  const haptics = useHaptics();
  
  // Tentar traduzir a pergunta, se não encontrar, usar o texto original
  const questionKey = `checklist.questions.${getQuestionKey(question)}`;
  
  // Tenta buscar a tradução
  const translated = t(questionKey);
  
  // Se a tradução retornou a própria chave ou contém o namespace, usar o texto original
  // Caso contrário, usar a tradução
  const translatedQuestion = (translated === questionKey || 
                              (typeof translated === 'string' && translated.includes('checklist.questions.')))
    ? question 
    : translated;

  // Determina se é não conforme para destacar
  const isNonConform = value === 'Não Conforme';
  
  // Estilos baseados no valor
  const getCardStyle = () => {
    if (isNonConform) {
      return {
        backgroundColor: 'rgba(252, 61, 57, 0.15)',
        borderColor: 'rgba(252, 61, 57, 0.5)',
        borderWidth: '2px',
      };
    }
    return {
      backgroundColor: 'rgba(28, 28, 30, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: '1px',
    };
  };

  const getOptionStyle = (optionValue: string) => {
    if (value === optionValue) {
      if (optionValue === 'Conforme') {
        return { color: '#53D769', fontWeight: '600' };
      } else if (optionValue === 'Não Conforme') {
        return { color: '#FC3D39', fontWeight: '600' };
      } else if (optionValue === 'N/A') {
        return { color: '#8E8E93', fontWeight: '600' };
      }
    }
    return { color: '#B0B0B0' };
  };

  const getIcon = (optionValue: string) => {
    if (value === optionValue) {
      if (optionValue === 'Conforme') {
        return '✓';
      } else if (optionValue === 'Não Conforme') {
        return '✗';
      } else if (optionValue === 'N/A') {
        return '—';
      }
    }
    return '';
  };
  
  return (
    <motion.div
      className="mb-3 p-4 rounded-lg border relative transition-all duration-200"
      style={{
        zIndex: 10,
        position: 'relative',
        ...getCardStyle(),
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
    >
      {isNonConform && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
            ⚠ Não Conforme
          </span>
        </motion.div>
      )}
      <label className="block text-sm font-medium mb-3" style={{ color: '#FFFFFF', paddingRight: isNonConform ? '100px' : '0' }}>
        {translatedQuestion}
      </label>
      <div className="flex gap-4 flex-wrap">
        <motion.label
          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: value === 'Conforme' ? 'rgba(83, 215, 105, 0.15)' : 'transparent',
            ...getOptionStyle('Conforme'),
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <input
            type="radio"
            name={`checklist_${question}`}
            value="Conforme"
            checked={value === 'Conforme'}
            onChange={() => {
              haptics.light(); // Feedback leve para conforme
              onChange('Conforme');
            }}
            className="w-4 h-4"
            style={{ accentColor: '#53D769' }}
          />
          <span className="text-sm font-medium">{getIcon('Conforme')}</span>
          <span className="text-sm">{t('checklist.conform')}</span>
        </motion.label>
        <motion.label
          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: value === 'Não Conforme' ? 'rgba(252, 61, 57, 0.15)' : 'transparent',
            ...getOptionStyle('Não Conforme'),
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <input
            type="radio"
            name={`checklist_${question}`}
            value="Não Conforme"
            checked={value === 'Não Conforme'}
            onChange={() => {
              haptics.medium(); // Feedback médio para não conforme (alerta)
              onChange('Não Conforme');
            }}
            className="w-4 h-4"
            style={{ accentColor: '#FC3D39' }}
          />
          <span className="text-sm font-medium">{getIcon('Não Conforme')}</span>
          <span className="text-sm">{t('checklist.nonConform')}</span>
        </motion.label>
        <motion.label
          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: value === 'N/A' ? 'rgba(142, 142, 147, 0.15)' : 'transparent',
            ...getOptionStyle('N/A'),
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <input
            type="radio"
            name={`checklist_${question}`}
            value="N/A"
            checked={value === 'N/A'}
            onChange={() => onChange('N/A')}
            className="w-4 h-4"
            style={{ accentColor: '#8E8E93' }}
          />
          <span className="text-sm font-medium">{getIcon('N/A')}</span>
          <span className="text-sm">{t('checklist.notApplicable')}</span>
        </motion.label>
      </div>
    </motion.div>
  );
};

export default ChecklistItem;

