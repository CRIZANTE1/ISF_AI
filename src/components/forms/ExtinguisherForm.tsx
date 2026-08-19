import { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import HelpTip from '../HelpTip';
import { CO2_AGENT_VALUE } from '../../utils/co2Weighing';
import { getCurrentLocation } from '../../hooks/useGeolocation';

interface ExtinguisherFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch?: UseFormWatch<any>;
  setValue?: UseFormSetValue<any>;
}

// Agentes extintores padronizados conforme normas brasileiras
const EXTINGUISHER_AGENTS = [
  { value: '', label: 'Selecione o tipo de agente' },
  { value: 'Água (H2O)', label: 'Água (H2O)' },
  { value: 'Espuma (AFFF)', label: 'Espuma (AFFF)' },
  { value: 'Pó Químico ABC', label: 'Pó Químico ABC' },
  { value: 'Pó Químico BC', label: 'Pó Químico BC' },
  { value: 'Pó Químico Seco (PQS)', label: 'Pó Químico Seco (PQS)' },
  { value: 'CO2', label: 'CO2 (Dióxido de Carbono)' },
  { value: 'Halon', label: 'Halon' },
  { value: 'Agente Limpo (FM-200)', label: 'Agente Limpo (FM-200)' },
  { value: 'Agente Limpo (Novec)', label: 'Agente Limpo (Novec)' },
  { value: 'Outro', label: 'Outro' },
];

// Capacidades padronizadas de extintores (em kg ou litros)
const EXTINGUISHER_CAPACITIES = [
  { value: '', label: 'Selecione a capacidade' },
  { value: '1', label: '1 kg/L' },
  { value: '2', label: '2 kg/L' },
  { value: '4', label: '4 kg/L' },
  { value: '6', label: '6 kg/L' },
  { value: '8', label: '8 kg/L' },
  { value: '10', label: '10 kg/L' },
  { value: '12', label: '12 kg/L' },
  { value: '20', label: '20 kg/L' },
  { value: '30', label: '30 kg/L' },
  { value: '40', label: '40 kg/L' },
  { value: '50', label: '50 kg/L' },
  { value: '80', label: '80 kg/L' },
  { value: '100', label: '100 kg/L' },
  { value: '150', label: '150 kg/L' },
  { value: '200', label: '200 kg/L' },
  { value: 'Outro', label: 'Outro (especificar)' },
];

const ExtinguisherForm = ({ register, errors, watch, setValue }: ExtinguisherFormProps) => {
  const { t } = useTranslation();
  const [showManualCapacity, setShowManualCapacity] = useState(false);
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const tipoAgente = watch?.('tipo_agente');

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

  const handleCapacityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Outro') {
      setShowManualCapacity(true);
    } else {
      setShowManualCapacity(false);
    }
  };

  return (
    <>
      {/* Nº Selo INMETRO removido - agora é registrado apenas nas inspeções de manutenção nível 2 ou 3 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="tipo_agente" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            Tipo de Agente <span className="text-gray-500 text-xs">(obrigatório)</span>
          </label>
          <HelpTip 
            titleKey="help.agentType.title"
            contentKey="help.agentType.content"
          />
        </div>
        <select
          id="tipo_agente"
          {...register('tipo_agente', { required: 'Tipo de agente é obrigatório' })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        >
          {EXTINGUISHER_AGENTS.map((agent) => (
            <option 
              key={agent.value} 
              value={agent.value}
              style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}
            >
              {agent.label}
            </option>
          ))}
        </select>
        {errors.tipo_agente && (
          <p className="text-sm text-red-500 mt-1">{String(errors.tipo_agente.message)}</p>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="capacidade" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            Capacidade <span className="text-gray-500 text-xs">(em kg ou litros)</span>
          </label>
          <HelpTip 
            titleKey="help.capacity.title"
            contentKey="help.capacity.content"
          />
        </div>
        {!showManualCapacity ? (
          <select
            id="capacidade"
            {...register('capacidade', { 
              setValueAs: (value) => {
                if (value === '' || value === 'Outro') return undefined;
                const numValue = parseFloat(value);
                return isNaN(numValue) ? undefined : numValue;
              }
            })}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            onChange={(e) => {
              handleCapacityChange(e);
              register('capacidade').onChange(e);
            }}
          >
            {EXTINGUISHER_CAPACITIES.map((capacity) => (
              <option 
                key={capacity.value} 
                value={capacity.value}
                style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}
              >
                {capacity.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="capacidade"
            type="number"
            step="0.1"
            min="0"
            placeholder="Digite a capacidade (kg ou L)"
            {...register('capacidade', { 
              valueAsNumber: true,
              min: { value: 0, message: 'Capacidade deve ser maior que zero' }
            })}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            autoFocus
          />
        )}
        {showManualCapacity && (
          <button
            type="button"
            onClick={() => {
              setShowManualCapacity(false);
              // Limpa o valor quando volta para o select
              const select = document.getElementById('capacidade') as HTMLInputElement;
              if (select) {
                select.value = '';
              }
            }}
            className="mt-2 text-sm text-gray-400 hover:text-white underline"
          >
            Voltar para seleção padronizada
          </button>
        )}
        {errors.capacidade && (
          <p className="text-sm text-red-500 mt-1">{String(errors.capacidade.message)}</p>
        )}
      </div>

      {tipoAgente === CO2_AGENT_VALUE && (
        <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: '#2A2A2A', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
            {t('extinguisher.co2Weighing.title')}
          </p>
          <p className="text-xs text-gray-400 mb-3">{t('extinguisher.co2Weighing.sectionHint')}</p>
          <div className="mb-3">
            <label htmlFor="peso_cheio_placa_kg" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('extinguisher.co2Weighing.pcPlateKg')}{' '}
              <span className="text-gray-500 text-xs">({t('extinguisher.co2Weighing.required')})</span>
            </label>
            <input
              id="peso_cheio_placa_kg"
              type="number"
              step="0.001"
              min="0"
              {...register('peso_cheio_placa_kg', {
                required: t('extinguisher.co2Weighing.pcRequired'),
                setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                min: { value: 0.001, message: t('extinguisher.co2Weighing.pcPositive') },
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.peso_cheio_placa_kg && (
              <p className="text-sm text-red-500 mt-1">{String(errors.peso_cheio_placa_kg.message)}</p>
            )}
          </div>
          <div>
            <label htmlFor="peso_vazio_conjunto_kg" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('extinguisher.co2Weighing.pvEmptyKg')}{' '}
              <span className="text-gray-500 text-xs">({t('extinguisher.co2Weighing.optional')})</span>
            </label>
            <input
              id="peso_vazio_conjunto_kg"
              type="number"
              step="0.001"
              min="0"
              {...register('peso_vazio_conjunto_kg', {
                setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
              })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="marca_fabricante" className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
          {t('equipment.manufacturerBrand', { defaultValue: 'Marca do Fabricante' })}
        </label>
        <input
          id="marca_fabricante"
          type="text"
          placeholder="Ex: Chubb, Kidde, 3M"
          {...register('marca_fabricante')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="numero_serie" className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
          {t('equipment.serialNumber', { defaultValue: 'Nº de Série' })} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
        </label>
        <input
          id="numero_serie"
          type="text"
          placeholder="Ex: SN123456"
          {...register('numero_serie')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="ano_fabricacao" className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
          {t('equipment.manufacturingYear', { defaultValue: 'Ano de Fabricação' })}
        </label>
        <input
          id="ano_fabricacao"
          type="number"
          min="1900"
          max={new Date().getFullYear() + 1}
          placeholder={`Ex: ${new Date().getFullYear()}`}
          {...register('ano_fabricacao', { 
            valueAsNumber: true,
            min: { value: 1900, message: 'Ano inválido' },
            max: { value: new Date().getFullYear() + 1, message: 'Ano não pode ser futuro' }
          })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
        {errors.ano_fabricacao && (
          <p className="text-sm text-red-500 mt-1">{String(errors.ano_fabricacao.message)}</p>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            {t('equipment.formHints.gpsCoordinates')} <span className="text-gray-500 text-xs">{t('equipment.formHints.optional')}</span>
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
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.latitude && (
              <p className="text-xs text-red-500 mt-1">{String(errors.latitude.message)}</p>
            )}
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
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.longitude && (
              <p className="text-xs text-red-500 mt-1">{String(errors.longitude.message)}</p>
            )}
          </div>
        </div>
        <p className="text-xs mt-1.5 text-gray-400">
          💡 {t('equipment.formHints.gpsCoordinatesHint')}
        </p>
      </div>
    </>
  );
};

export default ExtinguisherForm;
