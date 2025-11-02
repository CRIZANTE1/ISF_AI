/**
 * Checklist específico para chuveiros/lava-olhos
 */

import ChecklistSection from '../ChecklistSection';
import { EYEWASH_CHECKLIST } from '../../constants/checklists';

interface EyewashChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
}

const EyewashChecklist = ({ results, onResultChange }: EyewashChecklistProps) => {
  return (
    <div>
      {Object.entries(EYEWASH_CHECKLIST).map(([category, questions]) => (
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

export default EyewashChecklist;

