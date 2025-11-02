import { UseFormRegister } from 'react-hook-form';

interface MultigasFormProps {
  register: UseFormRegister<any>;
}

const MultigasForm = ({ register }: MultigasFormProps) => {
  return (
    <>
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
      <div className="mb-4">
        <label htmlFor="numero_serie" className="block text-sm font-medium mb-1">Nº de Série</label>
        <input
          id="numero_serie"
          {...register('numero_serie')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="LEL_cilindro" className="block text-sm font-medium mb-1">LEL Cilindro</label>
        <input
          id="LEL_cilindro"
          type="number"
          step="0.1"
          {...register('LEL_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="O2_cilindro" className="block text-sm font-medium mb-1">O2 Cilindro</label>
        <input
          id="O2_cilindro"
          type="number"
          step="0.1"
          {...register('O2_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
        />
      </div>
    </>
  );
};

export default MultigasForm;

