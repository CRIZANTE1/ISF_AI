import { UseFormRegister } from 'react-hook-form';
import { useTranslation } from '../../hooks/useTranslation';
import HelpTip from '../HelpTip';

interface MultigasFormProps {
  register: UseFormRegister<any>;
}

const MultigasForm = ({ register }: MultigasFormProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="mb-4">
        <label htmlFor="marca" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.brand', { defaultValue: 'Marca' })}
        </label>
        <input
          id="marca"
          {...register('marca')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="modelo" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
          {t('equipment.model', { defaultValue: 'Modelo' })}
        </label>
        <input
          id="modelo"
          {...register('modelo')}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
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
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white placeholder-gray-500" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="lel_cilindro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            LEL {t('equipment.cylinder', { defaultValue: 'Cilindro' })}
          </label>
          <HelpTip 
            titleKey="help.lelCylinder.title"
            contentKey="help.lelCylinder.content"
          />
        </div>
        <input
          id="lel_cilindro"
          type="number"
          step="0.1"
          {...register('lel_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="o2_cilindro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            O2 {t('equipment.cylinder', { defaultValue: 'Cilindro' })}
          </label>
          <HelpTip 
            titleKey="help.o2Cylinder.title"
            contentKey="help.o2Cylinder.content"
          />
        </div>
        <input
          id="o2_cilindro"
          type="number"
          step="0.1"
          {...register('o2_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="h2s_cilindro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            H2S {t('equipment.cylinder', { defaultValue: 'Cilindro' })}
          </label>
          <HelpTip 
            titleKey="help.h2sCylinder.title"
            contentKey="help.h2sCylinder.content"
          />
        </div>
        <input
          id="h2s_cilindro"
          type="number"
          step="1"
          {...register('h2s_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="co_cilindro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            CO {t('equipment.cylinder', { defaultValue: 'Cilindro' })}
          </label>
          <HelpTip 
            titleKey="help.coCylinder.title"
            contentKey="help.coCylinder.content"
          />
        </div>
        <input
          id="co_cilindro"
          type="number"
          step="1"
          {...register('co_cilindro', { valueAsNumber: true })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="margem_erro_cilindro" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
            {t('equipment.cylinderErrorMargin', { defaultValue: 'Margem de Erro do Cilindro (%)' })}
          </label>
          <HelpTip 
            titleKey="help.errorMargin.title"
            contentKey="help.errorMargin.content"
          />
        </div>
        <input
          id="margem_erro_cilindro"
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder="20.0"
          {...register('margem_erro_cilindro', { 
            valueAsNumber: true,
            min: { value: 0, message: t('equipment.errorMarginMin', { defaultValue: 'A margem de erro deve ser maior ou igual a 0' }) },
            max: { value: 100, message: t('equipment.errorMarginMax', { defaultValue: 'A margem de erro deve ser menor ou igual a 100' }) }
          })}
          className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white" 
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        />
        <p className="text-xs text-gray-400 mt-1">
          {t('equipment.errorMarginHint', { defaultValue: 'Margem de tolerância em percentual para os valores do cilindro durante inspeções. Padrão: 20%' })}
        </p>
      </div>
    </>
  );
};

export default MultigasForm;

