/**
 * Componente reutilizável para uma seção de checklist
 */

import ChecklistItem from './ChecklistItem';
import { useTranslation } from '../hooks/useTranslation';

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
  
  return (
    <div className="mb-6 relative" style={{ zIndex: 10, position: 'relative' }}>
      <h3 className="text-lg font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary" style={{ color: '#FFFFFF' }}>
        {translatedTitle}
      </h3>
      <div className="space-y-2">
        {questions.map((question) => (
          <ChecklistItem
            key={question}
            question={question}
            value={results[question]}
            onChange={(value) => onResultChange(question, value)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChecklistSection;

