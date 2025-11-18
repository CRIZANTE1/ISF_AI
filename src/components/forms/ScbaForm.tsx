import { UseFormRegister } from 'react-hook-form';

interface ScbaFormProps {
  register: UseFormRegister<any>;
}

const ScbaForm = ({ register }: ScbaFormProps) => {
  return (
    <>
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
      <div className="mb-4">
        <label htmlFor="numero_serie_mascara" className="block text-sm font-medium mb-1">Nº de Série (Máscara) <span className="text-gray-400 text-xs">(opcional)</span></label>
        <input
          id="numero_serie_mascara"
          {...register('numero_serie_mascara')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="numero_serie_segundo_estagio" className="block text-sm font-medium mb-1">Nº de Série (Segundo Estágio) <span className="text-gray-400 text-xs">(opcional)</span></label>
        <input
          id="numero_serie_segundo_estagio"
          {...register('numero_serie_segundo_estagio')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default ScbaForm;
