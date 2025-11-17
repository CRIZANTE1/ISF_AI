/**
 * Checklist específico para sistemas de alarme
 */

import ChecklistSection from '../ChecklistSection';
import { ALARM_CHECKLIST } from '../../constants/checklists';

interface AlarmChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
}

const AlarmChecklist = ({ results, onResultChange }: AlarmChecklistProps) => {
  return (
    <div>
      {Object.entries(ALARM_CHECKLIST).map(([category, questions]) => (
        <ChecklistSection
          key={category}
          title={category}
          questions={questions}
          results={results}
          onResultChange={onResultChange}
        />
      ))}
    </div>
  );
};

export default AlarmChecklist;

