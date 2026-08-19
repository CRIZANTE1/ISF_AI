import { useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import { getCurrentLocation } from '../../hooks/useGeolocation';

interface EyewashFormProps {
  register: UseFormRegister<any>;
  setValue?: UseFormSetValue<any>;
}

const EyewashForm = ({ register, setValue }: EyewashFormProps) => {
  const { t } = useTranslation();
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const capturarGPS = async () => {
    if (!setValue) return;
    setCapturandoGPS(true);
    setGpsMsg(null);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setValue('latitude', loc.latitude, { shouldValidate: true });
        setValue('longitude', loc.longitude, { shouldValidate: true });
        setGpsMsg({ tipo: 'sucesso', texto: `GPS capturado: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}` });
      } else {
        setGpsMsg({ tipo: 'erro', texto: 'Não foi possível obter a localização. Verifique as permissões.' });
      }
    } catch {
      setGpsMsg({ tipo: 'erro', texto: 'Erro ao capturar GPS. Verifique as permissões do navegador.' });
    } finally {
      setCapturandoGPS(false);
    }
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
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        />
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.formHints.gpsCoordinates')} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
          </label>
          {setValue && (
            <button
              type="button"
              onClick={capturarGPS}
              disabled={capturandoGPS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: capturandoGPS ? '#2A2A2A' : '#157EFB', color: '#FFFFFF', opacity: capturandoGPS ? 0.7 : 1 }}
            >
              {capturandoGPS ? '⏳ Capturando...' : '📍 Capturar GPS'}
            </button>
          )}
        </div>
        {gpsMsg && (
          <p className="text-xs mb-2 px-2 py-1.5 rounded" style={{ backgroundColor: gpsMsg.tipo === 'sucesso' ? '#1a3a1a' : '#3a1a1a', color: gpsMsg.tipo === 'sucesso' ? '#53D769' : '#FC3D39' }}>
            {gpsMsg.texto}
          </p>
        )}
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

export default EyewashForm;
