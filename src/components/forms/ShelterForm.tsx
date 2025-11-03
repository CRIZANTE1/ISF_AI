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
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="local" className="block text-sm font-medium mb-1">Local</label>
        <input
          id="local"
          {...register('local')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none"
        />
      </div>
    </>
  );
};

export default ShelterForm;

