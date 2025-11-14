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
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default AlarmForm;

