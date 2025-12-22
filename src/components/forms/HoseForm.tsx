import { UseFormRegister } from 'react-hook-form';
import { AddEquipmentFormData } from '../../pages/AddEquipmentPage'; // Can be reused
import { useTranslation } from '../../hooks/useTranslation';
import HelpTip from '../HelpTip';

interface HoseFormProps {
  register: UseFormRegister<AddEquipmentFormData>;
}

const HoseForm = ({ register }: HoseFormProps) => {
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
          {...register('specifications.marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="diametro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.diameter', { defaultValue: 'Diâmetro' })}
          </label>
          <HelpTip 
            titleKey="help.hoseDiameter.title"
            contentKey="help.hoseDiameter.content"
          />
        </div>
        <input
          id="diametro"
          {...register('specifications.diametro')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="comprimento" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.length', { defaultValue: 'Comprimento' })} (m)
          </label>
          <HelpTip 
            titleKey="help.hoseLength.title"
            contentKey="help.hoseLength.content"
          />
        </div>
        <input
          id="comprimento"
          type="number"
          {...register('specifications.comprimento', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
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
          {...register('specifications.numero_serie')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
    </>
  );
};

export default HoseForm;
