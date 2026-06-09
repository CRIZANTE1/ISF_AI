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
        <p className="text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
          {t('equipment.marginsPerGas', { defaultValue: 'Margens de Erro por Vapor (%)' })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['lel', 'o2', 'h2s', 'co'] as const).map((gas) => (
            <div key={gas}>
              <label htmlFor={`margem_erro_${gas}`} className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>
                {gas.toUpperCase() === 'LEL' ? 'LEL' : gas === 'o2' ? 'O²' : gas === 'h2s' ? 'H²S' : 'CO'}
              </label>
              <input
                id={`margem_erro_${gas}`}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="20.0"
                {...register(`margem_erro_${gas}`, { valueAsNumber: true })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t('equipment.errorMarginHint', { defaultValue: 'Margem de tolerância em percentual por vapor. Se vazio, usa margem genérica de 20%.' })}
        </p>
      </div>
    </>
  );
};

export default MultigasForm;

