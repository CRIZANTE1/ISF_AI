import { UseFormRegister } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import HelpTip from '../HelpTip';

interface ScbaFormProps {
  register: UseFormRegister<any>;
}

const ScbaForm = ({ register }: ScbaFormProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="marca" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.brand', { defaultValue: 'Marca' })}
          </label>
        </div>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="modelo" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.model', { defaultValue: 'Modelo' })}
          </label>
        </div>
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="numero_serie_mascara" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.maskSerialNumber', { defaultValue: 'Nº de Série (Máscara)' })} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
          </label>
          <HelpTip 
            titleKey="help.scbaMaskSerial.title"
            contentKey="help.scbaMaskSerial.content"
          />
        </div>
        <input
          id="numero_serie_mascara"
          {...register('numero_serie_mascara')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="numero_serie_segundo_estagio" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.secondStageSerialNumber', { defaultValue: 'Nº de Série (Segundo Estágio)' })} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
          </label>
          <HelpTip 
            titleKey="help.scbaSecondStageSerial.title"
            contentKey="help.scbaSecondStageSerial.content"
          />
        </div>
        <input
          id="numero_serie_segundo_estagio"
          {...register('numero_serie_segundo_estagio')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default ScbaForm;
