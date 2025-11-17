/**
 * Checklist específico para mangueiras
 */

import ChecklistSection from '../ChecklistSection';
import { HOSE_CHECKLIST } from '../../constants/checklists';

interface HoseChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  focusedQuestionId?: string;
}

const HoseChecklist = ({ results, onResultChange, focusedQuestionId }: HoseChecklistProps) => {
  return (
    <div>
      {Object.entries(HOSE_CHECKLIST).map(([category, questions]) => (
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

export default HoseChecklist;

