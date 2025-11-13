/**
 * Componente reutilizável para um item de checklist
 */

interface ChecklistItemProps {
  question: string;
  value?: string;
  onChange: (value: string) => void;
}

const ChecklistItem = ({ question, value, onChange }: ChecklistItemProps) => {
  return (
    <div className="mb-4 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(28, 28, 30, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <label className="block text-sm font-medium mb-2">{question}</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`checklist_${question}`}
            value="Conforme"
            checked={value === 'Conforme'}
            onChange={() => onChange('Conforme')}
            className="w-4 h-4"
            style={{ color: '#00C8FF', accentColor: '#00C8FF' }}
          />
          <span className="text-sm">Conforme</span>
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
          <span className="text-sm">Não Conforme</span>
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
          <span className="text-sm">N/A</span>
        </label>
      </div>
    </div>
  );
};

export default ChecklistItem;

