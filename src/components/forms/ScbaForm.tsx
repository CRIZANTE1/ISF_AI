import { UseFormRegister } from 'react-hook-form';
import { AddEquipmentFormData } from '../../pages/AddEquipmentPage';

interface ScbaFormProps {
  register: UseFormRegister<AddEquipmentFormData>;
}

const ScbaForm = ({ register }: ScbaFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
        <input
          id="marca"
          {...register('specifications.marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
        <input
          id="modelo"
          {...register('specifications.modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="numero_serie_cilindro" className="block text-sm font-medium mb-1">Nº de Série (Cilindro)</label>
        <input
          id="numero_serie_cilindro"
          {...register('specifications.numero_serie_cilindro')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="pressao_trabalho" className="block text-sm font-medium mb-1">Pressão de Trabalho (bar)</label>
        <input
          id="pressao_trabalho"
          type="number"
          {...register('specifications.pressao_trabalho', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default ScbaForm;
