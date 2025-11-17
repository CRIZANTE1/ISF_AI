/**
 * Componente reutilizável para um item de checklist
 */

import { useTranslation } from '../hooks/useTranslation';

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
  
  return (
    <div className="mb-4 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(28, 28, 30, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>{translatedQuestion}</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`checklist_${question}`}
            value="Conforme"
            checked={value === 'Conforme'}
            onChange={() => onChange('Conforme')}
            className="w-4 h-4"
            style={{ color: '#FFFFFF', accentColor: '#FFFFFF' }}
          />
          <span className="text-sm" style={{ color: '#FFFFFF' }}>{t('checklist.conform')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`checklist_${question}`}
            value="Não Conforme"
            checked={value === 'Não Conforme'}
            onChange={() => onChange('Não Conforme')}
            className="w-4 h-4 text-status-error focus:ring-status-error"
          />
          <span className="text-sm" style={{ color: '#FFFFFF' }}>{t('checklist.nonConform')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`checklist_${question}`}
            value="N/A"
            checked={value === 'N/A'}
            onChange={() => onChange('N/A')}
            className="w-4 h-4 text-light-text-secondary focus:ring-light-text-secondary"
          />
          <span className="text-sm" style={{ color: '#FFFFFF' }}>{t('checklist.notApplicable')}</span>
        </label>
      </div>
    </div>
  );
};

export default ChecklistItem;

