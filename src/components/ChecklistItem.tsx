/**
 * Componente reutilizável para um item de checklist
 */

import { useTranslation } from '../hooks/useTranslation';
import { Check, X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface ChecklistItemProps {
  question: string;
  value?: string;
  onChange: (value: string) => void;
  isFocused?: boolean;
  questionId?: string;
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

const ChecklistItem = ({ question, value, onChange, isFocused = false, questionId }: ChecklistItemProps) => {
  const { t } = useTranslation();
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Scroll automático quando o item recebe foco
  useEffect(() => {
    if (isFocused && itemRef.current) {
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isFocused]);
  
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

  // Determina se é não conforme
  const isNonConform = value === 'Não Conforme' || value === 'Reprovado' || value === 'N/C';
  
  // Cores e estilos baseados no valor
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Conforme':
      case 'C':
      case 'Aprovado':
        return {
          color: '#10B981', // Verde
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          icon: <Check className="w-4 h-4" />
        };
      case 'Não Conforme':
      case 'N/C':
      case 'Reprovado':
        return {
          color: '#EF4444', // Vermelho
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          icon: <X className="w-4 h-4" />
        };
      case 'N/A':
        return {
          color: '#6B7280', // Cinza
          bgColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.2)',
          icon: <Minus className="w-4 h-4" />
        };
      default:
        return {
          color: '#FFFFFF',
          bgColor: 'rgba(28, 28, 30, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          icon: null
        };
    }
  };

  const statusStyle = value ? getStatusStyle(value) : getStatusStyle('');

  return (
    <motion.div
      ref={itemRef}
      id={questionId}
      className="mb-4 relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
          isFocused ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
        } ${
          isNonConform ? 'shadow-lg shadow-red-500/20' : ''
        }`}
        style={{
          zIndex: isFocused ? 20 : 10,
          position: 'relative',
          backgroundColor: isNonConform ? statusStyle.bgColor : 'rgba(28, 28, 30, 0.9)',
          borderColor: isNonConform ? statusStyle.borderColor : (isFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)'),
          borderWidth: '2px',
        }}
      >
        {/* Indicador de não conformidade */}
        {isNonConform && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg"
          >
            <X className="w-3 h-3 text-white" />
          </motion.div>
        )}

        <label className="block text-sm font-medium mb-3" style={{ color: '#FFFFFF' }}>
          {translatedQuestion}
        </label>
        
        <div className="flex gap-3 flex-wrap">
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all ${
              value === 'Conforme' ? 'bg-green-500/20' : 'hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name={`checklist_${question}`}
              value="Conforme"
              checked={value === 'Conforme'}
              onChange={() => onChange('Conforme')}
              className="w-4 h-4"
              style={{ accentColor: '#10B981' }}
            />
            <Check className="w-4 h-4" style={{ color: '#10B981' }} />
            <span className="text-sm font-medium" style={{ color: value === 'Conforme' ? '#10B981' : '#FFFFFF' }}>
              {t('checklist.conform')}
            </span>
          </motion.label>

          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all ${
              value === 'Não Conforme' ? 'bg-red-500/20' : 'hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name={`checklist_${question}`}
              value="Não Conforme"
              checked={value === 'Não Conforme'}
              onChange={() => onChange('Não Conforme')}
              className="w-4 h-4"
              style={{ accentColor: '#EF4444' }}
            />
            <X className="w-4 h-4" style={{ color: '#EF4444' }} />
            <span className="text-sm font-medium" style={{ color: value === 'Não Conforme' ? '#EF4444' : '#FFFFFF' }}>
              {t('checklist.nonConform')}
            </span>
          </motion.label>

          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all ${
              value === 'N/A' ? 'bg-gray-500/20' : 'hover:bg-white/5'
            }`}
          >
            <input
              type="radio"
              name={`checklist_${question}`}
              value="N/A"
              checked={value === 'N/A'}
              onChange={() => onChange('N/A')}
              className="w-4 h-4"
              style={{ accentColor: '#6B7280' }}
            />
            <Minus className="w-4 h-4" style={{ color: '#6B7280' }} />
            <span className="text-sm font-medium" style={{ color: value === 'N/A' ? '#6B7280' : '#FFFFFF' }}>
              {t('checklist.notApplicable')}
            </span>
          </motion.label>
        </div>
      </div>
    </motion.div>
  );
};

export default ChecklistItem;

