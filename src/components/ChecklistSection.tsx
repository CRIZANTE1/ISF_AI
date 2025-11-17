/**
 * Componente reutilizável para uma seção de checklist
 */

import ChecklistItem from './ChecklistItem';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ChecklistSectionProps {
  title: string;
  questions: string[];
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
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

const ChecklistSection = ({ title, questions, results, onResultChange }: ChecklistSectionProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  
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

  // Calcula estatísticas da seção
  const answered = questions.filter(q => results[q]).length;
  const total = questions.length;
  const nonConformities = questions.filter(q => results[q] === 'Não Conforme').length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  
  return (
    <motion.div
      className="mb-6 relative"
      style={{ zIndex: 10, position: 'relative' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Separador visual */}
      <div className="mb-4 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {/* Cabeçalho da seção com indicador de progresso */}
      <motion.div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ opacity: 0.8 }}
      >
        <div className="flex items-center gap-3 flex-1">
          <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
            {translatedTitle}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#B0B0B0' }}>
              {answered}/{total}
            </span>
            {nonConformities > 0 && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
                {nonConformities} N/C
              </span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: '#FFFFFF' }}
        >
          ▼
        </motion.div>
      </motion.div>

      {/* Barra de progresso */}
      <div className="mb-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: nonConformities > 0 ? '#FC3D39' : '#53D769',
            width: `${progress}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Conteúdo da seção (colapsável) */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="space-y-2">
          {questions.map((question, index) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <ChecklistItem
                question={question}
                value={results[question]}
                onChange={(value) => onResultChange(question, value)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChecklistSection;

