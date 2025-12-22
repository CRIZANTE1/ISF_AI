import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import HelpTip from '../HelpTip';

interface FoamChamberFormProps {
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  watch?: UseFormWatch<any>;
}

const FOAM_CHAMBER_TYPES = [
  { value: 'MCS', label: 'MCS - Multi-Chamber System (Tanques de teto fixo)' },
  { value: 'TC', label: 'TC - Tubo Cascata/Tubo Cascading (Tanques de teto fixo)' },
  { value: 'TF', label: 'TF - Tubo Flutuante/Floating Roof (Tanques de teto flutuante)' },
  { value: 'MBS', label: 'MBS - Muro de Contenção/Dike (Inundação de diques)' },
];

const MCS_NUMBERS = [
  { value: '9', label: 'MCS 9' },
  { value: '17', label: 'MCS 17' },
  { value: '33', label: 'MCS 33' },
  { value: '55', label: 'MCS 55' },
  { value: 'outro', label: 'Outro (especificar)' },
];

const FoamChamberForm = ({ register, errors, watch }: FoamChamberFormProps) => {
  const { t } = useTranslation();
  const tipoCamara = watch?.('tipo_camara');
  const numeroMCS = watch?.('numero_mcs');
  const isMCS = tipoCamara === 'MCS';
  const isOutro = numeroMCS === 'outro';
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="tipo_camara" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.formHints.chamberType')} <span className="text-gray-400 text-xs">{t('equipment.formHints.required')}</span>
          </label>
          <HelpTip 
            titleKey="help.chamberType.title"
            contentKey="help.chamberType.content"
          />
        </div>
        <select
          id="tipo_camara"
          {...register('tipo_camara', { required: t('equipment.formHints.selectChamberType') + ' ' + t('equipment.formHints.required') })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
        >
          <option value="">{t('equipment.formHints.selectChamberType')}</option>
          {FOAM_CHAMBER_TYPES.map((type) => (
            <option key={type.value} value={type.value} style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
          💡 {t('equipment.formHints.selectChamberTypeHint')}
        </p>
        {errors?.tipo_camara && (
          <p className="text-sm text-status-error mt-1">
            {String(errors.tipo_camara?.message)}
          </p>
        )}
      </div>
      
      {isMCS && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="numero_mcs" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
              {t('equipment.formHints.mcsNumber')} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
            </label>
            <HelpTip 
              titleKey="help.mcsNumber.title"
              contentKey="help.mcsNumber.content"
            />
          </div>
          <select
            id="numero_mcs"
            {...register('numero_mcs')}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
          >
            <option value="">{t('equipment.formHints.selectMCSNumber')}</option>
            {MCS_NUMBERS.map((num) => (
              <option key={num.value} value={num.value} style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                {num.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1.5" style={{ color: '#B0B0B0' }}>
            💡 {t('equipment.formHints.mcsNumberHint')}
          </p>
          {isOutro && (
            <div className="mt-2">
              <label htmlFor="numero_mcs_custom" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                {t('equipment.formHints.specifyMCSNumber')}
              </label>
              <input
                id="numero_mcs_custom"
                {...register('numero_mcs_custom')}
                placeholder="Ex: 25, 40, 60..."
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            </div>
          )}
        </div>
      )}
      
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
        <label htmlFor="tamanho_especifico" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.specificSize', { defaultValue: 'Tamanho Específico' })}
        </label>
        <input
          id="tamanho_especifico"
          {...register('tamanho_especifico')}
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

export default FoamChamberForm;

