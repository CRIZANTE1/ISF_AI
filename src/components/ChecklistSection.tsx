/**
 * Componente reutilizável para uma seção de checklist
 */

import ChecklistItem from './ChecklistItem';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

interface ChecklistSectionProps {
  title: string;
  questions: string[];
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  focusedQuestionId?: string;
}

// Função helper para gerar chave de tradução baseada no título
const getTitleKey = (title: string): string => {
  // Normaliza caracteres especiais e converte para minúsculas
  return title
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

const ChecklistSection = ({ title, questions, results, onResultChange, focusedQuestionId }: ChecklistSectionProps) => {
  const { t } = useTranslation();
  
  // Tentar traduzir o título, se não encontrar, usar o texto original
  const titleKey = `checklist.sections.${getTitleKey(title)}`;
  
  // Tenta buscar a tradução
  const translated = t(titleKey);
  
  // Se a tradução retornou a própria chave ou contém o namespace, usar o texto original
  // Caso contrário, usar a tradução
  const translatedTitle = (translated === titleKey || 
                           (typeof translated === 'string' && translated.includes('checklist.sections.')))
    ? title 
    : translated;

  // Conta quantas perguntas foram respondidas nesta seção
  const answeredCount = questions.filter(q => results[q]).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
  
  return (
    <motion.div
      className="mb-8 relative"
      style={{ zIndex: 10, position: 'relative' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Separador visual */}
      <div className="mb-4 pb-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary" style={{ color: '#FFFFFF' }}>
            {translatedTitle}
          </h3>
          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
            {answeredCount}/{totalCount}
          </span>
        </div>
        {/* Barra de progresso da seção */}
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {questions.map((question, index) => {
          const questionId = `checklist-${title}-${index}`;
          return (
            <ChecklistItem
              key={question}
              question={question}
              value={results[question]}
              onChange={(value) => onResultChange(question, value)}
              isFocused={focusedQuestionId === questionId}
              questionId={questionId}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default ChecklistSection;

