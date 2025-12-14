import { UseFormRegister } from 'react-hook-form';

interface ShelterFormProps {
  register: UseFormRegister<any>;
}

const ShelterForm = ({ register }: ShelterFormProps) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="cliente" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>Cliente</label>
        <input
          id="cliente"
          {...register('cliente')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="local" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>Local</label>
        <input
          id="local"
          {...register('local')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          Coordenadas GPS <span className="text-gray-400 text-xs">(opcional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">Latitude</label>
            <input
              id="latitude"
              type="number"
              step="any"
              placeholder="Ex: -23.5505"
              {...register('latitude', { 
                valueAsNumber: true,
                min: { value: -90, message: 'Latitude deve estar entre -90 e 90' },
                max: { value: 90, message: 'Latitude deve estar entre -90 e 90' }
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">Longitude</label>
            <input
              id="longitude"
              type="number"
              step="any"
              placeholder="Ex: -46.6333"
              {...register('longitude', { 
                valueAsNumber: true,
                min: { value: -180, message: 'Longitude deve estar entre -180 e 180' },
                max: { value: 180, message: 'Longitude deve estar entre -180 e 180' }
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
          💡 As coordenadas GPS são opcionais no cadastro. A captura automática por GPS ocorre apenas durante as inspeções.
        </p>
      </div>
    </>
  );
};

export default ShelterForm;

