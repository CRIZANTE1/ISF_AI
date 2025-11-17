/**
 * Checklist específico para câmaras de espuma
 */

import ChecklistSection from '../ChecklistSection';
import { FOAM_CHAMBER_CHECKLIST } from '../../constants/checklists';
import { useTranslation } from '../../hooks/useTranslation';

interface FoamChamberChecklistProps {
  model?: string;
  inspectionType: 'Visual Semestral' | 'Funcional Anual';
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
}

const FoamChamberChecklist = ({
  model,
  inspectionType,
  results,
  onResultChange,
}: FoamChamberChecklistProps) => {
  const { t } = useTranslation();
  
  if (!model || !FOAM_CHAMBER_CHECKLIST[model]) {
    return (
      <div className="p-4 bg-status-warning/20 text-status-warning rounded-lg">
        <p>{t('checklist.modelNotRecognized')}</p>
      </div>
    );
  }

  const checklist = FOAM_CHAMBER_CHECKLIST[model];
  const sections = Object.keys(checklist);
  
  // Se for inspeção visual, remove a seção de teste funcional
  const sectionsToShow = inspectionType === 'Visual Semestral' 
    ? sections.filter(s => s !== 'Teste Funcional')
    : sections;

  return (
    <div>
      {sectionsToShow.map((category) => (
        <ChecklistSection
          key={category}
          title={category}
          questions={checklist[category]}
          results={results}
          onResultChange={onResultChange}
        />
      ))}
    </div>
  );
};

export default FoamChamberChecklist;

