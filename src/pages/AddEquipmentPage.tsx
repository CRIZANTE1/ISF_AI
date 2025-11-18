import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import MultigasForm from '../components/forms/MultigasForm';
import { saveNewExtinguisher } from '../utils/extinguisherOperations';
import { saveNewHose } from '../utils/hoseOperations';
import { saveNewSCBA } from '../utils/scbaOperations';
import { saveNewMultigasDetector } from '../utils/multigasOperations';
import { saveNewFoamChamber } from '../utils/foamChamberOperations';
import { saveNewCannonMonitor } from '../utils/cannonMonitorOperations';
import { saveNewEyewashStation } from '../utils/eyewashOperations';
import { saveNewAlarmSystem } from '../utils/alarmOperations';
import { saveNewShelter } from '../utils/shelterOperations';

const AddEquipmentPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { executeWithFeedback } = useErrorHandler();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<any>();

  const getEquipmentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      extintor: t('equipment.extinguisher'),
      mangueira: t('equipment.hose'),
      camara_espuma: t('equipment.foamChamber'),
      canhao_monitor: t('equipment.cannonMonitor'),
      chuveiro_lavaolhos: t('equipment.eyewash'),
      alarme: t('equipment.alarm'),
      multigas: t('equipment.multigas'),
      scba: t('equipment.scba'),
      abrigo: t('equipment.shelter'),
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  const equipmentTypeName = type ? getEquipmentTypeName(type) : t('equipment.title');

  const onSubmit = async (formData: any) => {
    if (!user || !type) return;
    setLoading(true);

    const dataToInsert: any = {
      ...formData,
      user_id: user.id,
      data_cadastro: new Date().toISOString().split('T')[0],
    };

    let saveFunction: (data: any) => Promise<boolean>;

    switch (type) {
      case 'extintor':
        saveFunction = () => saveNewExtinguisher({
          numero_identificacao: formData.numero_identificacao || formData.equipment_id,
          ...dataToInsert,
        });
        break;
      case 'mangueira':
        saveFunction = () => saveNewHose({
          id_mangueira: formData.id_mangueira || formData.equipment_id,
          ...dataToInsert,
        });
        break;
      case 'scba':
        saveFunction = () => saveNewSCBA({
          numero_serie_equipamento: formData.numero_serie_equipamento || formData.equipment_id,
          ...dataToInsert,
        });
        break;
      case 'multigas':
        saveFunction = () => saveNewMultigasDetector({
          id_equipamento: formData.id_equipamento || formData.equipment_id,
          ...dataToInsert,
        });
        break;
      case 'camara_espuma':
        saveFunction = () => saveNewFoamChamber({
          id_camara: formData.id_camara || formData.equipment_id,
          localizacao: formData.localizacao,
          ...dataToInsert,
        });
        break;
      case 'canhao_monitor':
        saveFunction = () => saveNewCannonMonitor({
          id_equipamento: formData.id_equipamento || formData.equipment_id,
          localizacao: formData.localizacao,
          ...dataToInsert,
        });
        break;
      case 'chuveiro_lavaolhos':
        saveFunction = () => saveNewEyewashStation({
          id_equipamento: formData.id_equipamento || formData.equipment_id,
          localizacao: formData.localizacao,
          ...dataToInsert,
        });
        break;
      case 'alarme':
        saveFunction = () => saveNewAlarmSystem({
          id_sistema: formData.id_sistema || formData.equipment_id,
          localizacao: formData.localizacao || '',
          ...dataToInsert,
        });
        break;
      case 'abrigo':
        saveFunction = () => saveNewShelter({
          id_abrigo: formData.id_abrigo || formData.equipment_id,
          ...dataToInsert,
        });
        break;
      default:
        setLoading(false);
        return;
    }

    const success = await executeWithFeedback(
      saveFunction,
      'equipment',
      'Equipamento cadastrado com sucesso!',
      'Falha ao cadastrar equipamento. Verifique se o ID já existe.'
    );

    if (success) {
      navigate(`/inspections/${type}`);
    }
    
    setLoading(false);
  };

  const renderSpecificForm = () => {
    switch (type) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      case 'multigas':
        return <MultigasForm register={register} />;
      default:
        return null;
    }
  };

  const getEquipmentIdField = () => {
    switch (type) {
      case 'extintor':
        return { name: 'numero_identificacao', label: 'Nº Identificação' };
      case 'mangueira':
        return { name: 'id_mangueira', label: 'ID Mangueira' };
      case 'scba':
        return { name: 'numero_serie_equipamento', label: 'Nº Série Equipamento' };
      case 'multigas':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'camara_espuma':
        return { name: 'id_camara', label: 'ID Câmara' };
      case 'canhao_monitor':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'chuveiro_lavaolhos':
        return { name: 'id_equipamento', label: 'ID Equipamento' };
      case 'alarme':
        return { name: 'id_sistema', label: 'ID Sistema' };
      case 'abrigo':
        return { name: 'id_abrigo', label: 'ID Abrigo' };
      default:
        return { name: 'equipment_id', label: 'ID do Equipamento' };
    }
  };

  const idField = getEquipmentIdField();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'equipment.add', defaultValue: `Adicionar ${equipmentTypeName}` }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor={idField.name} className="block text-sm font-medium mb-1">{idField.label}</label>
            <input
              id={idField.name}
              {...register(idField.name, { required: `${idField.label} é obrigatório` })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors[idField.name as keyof typeof errors] && (
              <p className="text-sm text-status-error mt-1">
                {String(errors[idField.name as keyof typeof errors]?.message)}
              </p>
            )}
          </div>
          
          {(type === 'camara_espuma' || type === 'canhao_monitor' || type === 'chuveiro_lavaolhos' || type === 'alarme') && (
            <div className="mb-4">
              <label htmlFor="localizacao" className="block text-sm font-medium mb-1">{t('equipment.location')}</label>
              <input
                id="localizacao"
                {...register('localizacao')}
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
              />
            </div>
          )}


          {type === 'alarme' && (
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
            </>
          )}

          {type === 'abrigo' && (
            <>
              <div className="mb-4">
                <label htmlFor="cliente" className="block text-sm font-medium mb-1">{t('equipment.client', { defaultValue: 'Cliente' })}</label>
                <input
                  id="cliente"
                  {...register('cliente')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="local" className="block text-sm font-medium mb-1">{t('equipment.location')}</label>
                <input
                  id="local"
                  {...register('local')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
            </>
          )}

          {renderSpecificForm()}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : t('equipment.saveSuccess', { defaultValue: 'Salvar Equipamento' })}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddEquipmentPage;
