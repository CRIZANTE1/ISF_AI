import { UseFormRegister } from 'react-hook-form';

interface FoamChamberFormProps {
  register: UseFormRegister<any>;
}

const FoamChamberForm = ({ register }: FoamChamberFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="localizacao" className="block text-sm font-medium mb-1">Localização</label>
        <input
          id="localizacao"
          {...register('localizacao')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="tamanho_especifico" className="block text-sm font-medium mb-1">Tamanho Específico</label>
        <input
          id="tamanho_especifico"
          {...register('tamanho_especifico')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default FoamChamberForm;

