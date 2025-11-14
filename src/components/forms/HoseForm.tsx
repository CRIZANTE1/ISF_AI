import { UseFormRegister } from 'react-hook-form';
import { AddEquipmentFormData } from '../../pages/AddEquipmentPage'; // Can be reused

interface HoseFormProps {
  register: UseFormRegister<AddEquipmentFormData>;
}

const HoseForm = ({ register }: HoseFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
        <input
          id="marca"
          {...register('specifications.marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="diametro" className="block text-sm font-medium mb-1">Diâmetro</label>
        <input
          id="diametro"
          {...register('specifications.diametro')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="comprimento" className="block text-sm font-medium mb-1">Comprimento (m)</label>
        <input
          id="comprimento"
          type="number"
          {...register('specifications.comprimento', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default HoseForm;
