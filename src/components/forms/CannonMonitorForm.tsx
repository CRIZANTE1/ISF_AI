import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect } from 'react';

interface CannonMonitorFormProps {
  register: UseFormRegister<any>;
  watch?: UseFormWatch<any>;
}

// Categorias de canhões monitores
const CANNON_CATEGORIES = [
  { value: 'Canhões Fixos', label: 'Canhões Fixos' },
  { value: 'Canhões Portáteis', label: 'Canhões Portáteis' },
  { value: 'Canhões Auto-Oscilatórios', label: 'Canhões Auto-Oscilatórios' },
  { value: 'Canhões de Controle Remoto', label: 'Canhões de Controle Remoto' },
];

// Função auxiliar para verificar se um modelo está na lista
const isModelInList = (modelo: string | undefined | null): boolean => {
  if (!modelo) return false;
  return CANNON_CATEGORIES.some(cat => cat.value === modelo);
};

const CannonMonitorForm = ({ register, watch }: CannonMonitorFormProps) => {
  const { t } = useTranslation();
  const { onChange, ...modeloRegister } = register('modelo');
  const modeloValue = watch ? watch('modelo') : undefined;
  
  // Detecta se o modelo inicial não está na lista
  const [showCustomModel, setShowCustomModel] = useState<boolean>(() => {
    return modeloValue ? !isModelInList(modeloValue) : false;
  });

  // Atualiza quando o valor do modelo muda externamente (ex: ao editar)
  useEffect(() => {
    if (modeloValue) {
      setShowCustomModel(!isModelInList(modeloValue));
    }
  }, [modeloValue]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'outro') {
      setShowCustomModel(true);
      // Limpa o valor quando seleciona "outro"
      e.target.value = '';
    } else {
      setShowCustomModel(false);
      onChange(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  return (
    <>
      <div className="mb-4">
        <label htmlFor="localizacao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.location', { defaultValue: 'Localização' })}
        </label>
        <input
          id="localizacao"
          {...register('localizacao')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.brand', { defaultValue: 'Marca' })}
        </label>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.model', { defaultValue: 'Modelo' })}
        </label>
        {!showCustomModel ? (
          <select
            id="modelo"
            {...modeloRegister}
            onChange={handleSelectChange}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
          >
            <option value="">{t('equipment.selectModel', { defaultValue: 'Selecione o modelo' })}</option>
            {CANNON_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
            <option value="outro">{t('equipment.other', { defaultValue: 'Outro' })}</option>
          </select>
        ) : (
          <div>
            <input
              id="modelo"
              type="text"
              {...modeloRegister}
              onChange={handleInputChange}
              placeholder={t('equipment.enterModel', { defaultValue: 'Digite o modelo' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
            <button
              type="button"
              onClick={() => setShowCustomModel(false)}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              {t('equipment.backToSelect', { defaultValue: '← Voltar para seleção' })}
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="numero_serie" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.serialNumber', { defaultValue: 'Nº de Série' })} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
        </label>
        <input
          id="numero_serie"
          type="text"
          placeholder="Ex: SN123456"
          {...register('numero_serie')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none placeholder-gray-500" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.formHints.gpsCoordinates')} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">{t('equipment.formHints.latitude')}</label>
            <input
              id="latitude"
              type="number"
              step="any"
              placeholder="Ex: -23.5505"
              {...register('latitude', { 
                valueAsNumber: true,
                min: { value: -90, message: t('equipment.formHints.latitudeRange') },
                max: { value: 90, message: t('equipment.formHints.latitudeRange') }
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">{t('equipment.formHints.longitude')}</label>
            <input
              id="longitude"
              type="number"
              step="any"
              placeholder="Ex: -46.6333"
              {...register('longitude', { 
                valueAsNumber: true,
                min: { value: -180, message: t('equipment.formHints.longitudeRange') },
                max: { value: 180, message: t('equipment.formHints.longitudeRange') }
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
          💡 {t('equipment.formHints.gpsCoordinatesHint')}
        </p>
      </div>
    </>
  );
};

export default CannonMonitorForm;

