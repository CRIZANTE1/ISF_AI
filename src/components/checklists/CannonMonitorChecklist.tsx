/**
 * Checklist específico para canhões monitores
 */

import ChecklistSection from '../ChecklistSection';
import { CANNON_MONITOR_CHECKLIST_VISUAL, CANNON_MONITOR_CHECKLIST_FUNCIONAL } from '../../constants/checklists';

interface CannonMonitorChecklistProps {
  inspectionType: 'Visual' | 'Funcional';
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  focusedQuestionId?: string;
}

const CannonMonitorChecklist = ({
  inspectionType,
  results,
  onResultChange,
  focusedQuestionId,
}: CannonMonitorChecklistProps) => {
  const checklist = inspectionType === 'Visual' 
    ? CANNON_MONITOR_CHECKLIST_VISUAL 
    : CANNON_MONITOR_CHECKLIST_FUNCIONAL;

  return (
    <div>
      {Object.entries(checklist).map(([category, questions]) => (
        <ChecklistSection
          key={category}
          title={category}
          questions={questions}
          results={results}
          onResultChange={onResultChange}
          focusedQuestionId={focusedQuestionId}
        />
      ))}
    </div>
  );
};

export default CannonMonitorChecklist;

