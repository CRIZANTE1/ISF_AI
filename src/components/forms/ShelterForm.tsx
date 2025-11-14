import { UseFormRegister } from 'react-hook-form';

interface ShelterFormProps {
  register: UseFormRegister<any>;
}

const ShelterForm = ({ register }: ShelterFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="cliente" className="block text-sm font-medium mb-1">Cliente</label>
        <input
          id="cliente"
          {...register('cliente')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="local" className="block text-sm font-medium mb-1">Local</label>
        <input
          id="local"
          {...register('local')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default ShelterForm;

