/**
 * Checklist específico para sistemas de alarme
 */

import ChecklistSection from '../ChecklistSection';
import { ALARM_CHECKLIST } from '../../constants/checklists';

interface AlarmChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  focusedQuestionId?: string;
}

const AlarmChecklist = ({ results, onResultChange, focusedQuestionId }: AlarmChecklistProps) => {
  return (
    <div>
      {Object.entries(ALARM_CHECKLIST).map(([category, questions]) => (
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

export default AlarmChecklist;

