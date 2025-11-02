/**
 * Componente reutilizável para uma seção de checklist
 */

import ChecklistItem from './ChecklistItem';

interface ChecklistSectionProps {
  title: string;
  questions: string[];
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
}

const ChecklistSection = ({ title, questions, results, onResultChange }: ChecklistSectionProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">
        {title}
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

