import { UseFormRegister } from 'react-hook-form';

interface AlarmFormProps {
  register: UseFormRegister<any>;
}

const AlarmForm = ({ register }: AlarmFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="localizacao" className="block text-sm font-medium mb-1">
          Localização *
        </label>
        <input
          id="localizacao"
          {...register('localizacao', { required: 'Localização é obrigatória' })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
    </>
  );
};

export default AlarmForm;

