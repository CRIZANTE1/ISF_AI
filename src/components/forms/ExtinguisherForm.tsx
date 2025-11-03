import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { AddEquipmentFormData } from '../../pages/AddEquipmentPage';

interface ExtinguisherFormProps {
  register: UseFormRegister<AddEquipmentFormData>;
  errors: FieldErrors<AddEquipmentFormData>;
}

const ExtinguisherForm = ({ register, errors }: ExtinguisherFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="numero_selo_inmetro" className="block text-sm font-medium mb-1">Nº Selo INMETRO</label>
        <input
          id="numero_selo_inmetro"
          {...register('specifications.numero_selo_inmetro')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="tipo_agente" className="block text-sm font-medium mb-1">Tipo de Agente</label>
        <input
          id="tipo_agente"
          {...register('specifications.tipo_agente')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="capacidade" className="block text-sm font-medium mb-1">Capacidade</label>
        <input
          id="capacidade"
          type="number"
          step="0.1"
          {...register('specifications.capacidade', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default ExtinguisherForm;
