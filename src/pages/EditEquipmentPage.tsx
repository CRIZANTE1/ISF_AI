import { useForm } from 'react-hook-form';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { logger } from '../utils/logger';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import MultigasForm from '../components/forms/MultigasForm';
import FoamChamberForm from '../components/forms/FoamChamberForm';
import CannonMonitorForm from '../components/forms/CannonMonitorForm';
import EyewashForm from '../components/forms/EyewashForm';
import AlarmForm from '../components/forms/AlarmForm';
import ShelterForm from '../components/forms/ShelterForm';
import CustomEquipmentForm from '../components/forms/CustomEquipmentForm';
import Skeleton from '../components/Skeleton';
import { getExtinguisherById } from '../utils/extinguisherOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllShelters } from '../utils/shelterOperations';
import { getAllHoses } from '../utils/hoseOperations';

type EquipmentData = Record<string, any>;

type EditEquipmentLocationState = {
  returnAfterSave?: string;
};

import InstructionsPanel from '../components/InstructionsPanel';

const EditEquipmentPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnAfterSave = (location.state as EditEquipmentLocationState | null)?.returnAfterSave;
  const { handleError, executeWithFeedback } = useErrorHandler();
  const { refreshCache } = useEquipmentCache();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [equipmentData, setEquipmentData] = useState<EquipmentData | null>(null);
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeId, setCustomTypeId] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EquipmentData>();

  // Verifica se é tipo customizado
  useEffect(() => {
    const checkCustomType = async () => {
      if (!type || !type.startsWith('custom-')) {
        setIsCustomType(false);
        return;
      }

      try {
        const { getAllCustomEquipmentTypes } = await import('../utils/customEquipmentOperations');
        const slug = type.replace('custom-', '');
        const customTypes = await getAllCustomEquipmentTypes();
        const foundType = customTypes.find(t => t.slug === slug);
        
        if (foundType) {
          setIsCustomType(true);
          setCustomTypeId(foundType.id);
        } else {
          setIsCustomType(false);
        }
      } catch (error) {
        logger.error('Erro ao verificar tipo customizado', 'equipment', error);
        setIsCustomType(false);
      }
    };

    checkCustomType();
  }, [type]);

  const instructionType = isCustomType ? 'add_custom' : `add_${type}`;

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id || !type) return;
      setLoadingData(true);

      try {
        let data: EquipmentData | null = null;

        switch (type) {
          case 'extintor': {
            const extData = await getExtinguisherById(id);
            if (extData) {
              data = extData;
            }
            break;
          }
          case 'mangueira': {
            const hoses = await getAllHoses();
            const hose = hoses.find(e => e.id_mangueira === id);
            if (hose) {
              data = hose;
            }
            break;
          }
          case 'scba': {
            const scbas = await getAllSCBAs();
            const scba = scbas.find(e => e.numero_serie_equipamento === id);
            if (scba) {
              data = scba;
            }
            break;
          }
          case 'multigas': {
            const detectors = await getAllMultigasDetectors();
            const detector = detectors.find(e => e.id_equipamento === id);
            if (detector) {
              data = detector;
            }
            break;
          }
          case 'camara_espuma': {
            const chambers = await getAllFoamChambers();
            const chamber = chambers.find(e => e.id_camara === id);
            if (chamber) {
              data = chamber;
            }
            break;
          }
          case 'canhao_monitor': {
            const monitors = await getAllCannonMonitors();
            const monitor = monitors.find(e => e.id_equipamento === id);
            if (monitor) {
              data = monitor;
            }
            break;
          }
          case 'chuveiro_lavaolhos': {
            const stations = await getAllEyewashStations();
            const station = stations.find(e => e.id_equipamento === id);
            if (station) {
              data = station;
            }
            break;
          }
          case 'alarme': {
            const systems = await getAllAlarmSystems();
            const system = systems.find(e => e.id_sistema === id);
            if (system) {
              data = system;
            }
            break;
          }
          case 'abrigo': {
            const shelters = await getAllShelters();
            const shelter = shelters.find(e => e.id_abrigo === id);
            if (shelter) {
              data = shelter;
            }
            break;
          }
          default:
            // Verifica se é tipo customizado
            if (type.startsWith('custom-')) {
              try {
                const { getAllCustomEquipmentTypes, getAllCustomEquipment } = await import('../utils/customEquipmentOperations');
                const slug = type.replace('custom-', '');
                const customTypes = await getAllCustomEquipmentTypes();
                const foundType = customTypes.find(t => t.slug === slug);
                
                if (foundType) {
                  const customEquipments = await getAllCustomEquipment(foundType.id);
                  const customEq = customEquipments.find((e: any) => e.id_equipamento === id);
                  if (customEq) {
                    data = {
                      ...customEq,
                      custom_fields: customEq.custom_fields || {},
                    };
                  }
                }
              } catch (error) {
                logger.error('Erro ao buscar equipamento customizado', 'equipment', error);
              }
            }
            break;
        }

        if (!data) {
          handleError(new Error('Equipamento não encontrado'), 'equipment');
        } else {
          setEquipmentData(data);
          reset(data);
        }
      } catch (err: any) {
        handleError(err, 'equipment', 'Erro ao buscar equipamento');
      } finally {
        setLoadingData(false);
      }
    };

    fetchEquipment();
  }, [id, type, reset]);

  const onSubmit = async (formData: EquipmentData) => {
    if (!id || !type) return;
    setLoading(true);

    let tableName = '';
    let idColumn = '';
    const { id: _, created_at, user_id, ...dataToUpdate } = formData;

    // Remove data_cadastro se o tipo não suportar essa coluna
    // Tabelas SEM data_cadastro: extintor, mangueira, scba, abrigo
    const tablesWithoutDataCadastro = ['extintor', 'mangueira', 'scba', 'abrigo'];
    if (tablesWithoutDataCadastro.includes(type) && 'data_cadastro' in dataToUpdate) {
      delete dataToUpdate.data_cadastro;
    }

    switch (type) {
      case 'extintor':
        tableName = 'extintores';
        idColumn = 'numero_identificacao';
        break;
      case 'mangueira':
        tableName = 'mangueiras';
        idColumn = 'id_mangueira';
        break;
      case 'scba':
        tableName = 'conjuntos_autonomos';
        idColumn = 'numero_serie_equipamento';
        break;
      case 'multigas': {
        tableName = 'inventario_multigas';
        idColumn = 'id_equipamento';
        // Mapeia campos maiúsculos para minúsculos (schema do Supabase)
        const multigasData: any = {
          ...dataToUpdate,
        };
        // Mapeia campos do cilindro se existirem
        if ('LEL_cilindro' in multigasData) {
          multigasData.lel_cilindro = multigasData.LEL_cilindro;
          delete multigasData.LEL_cilindro;
        }
        if ('O2_cilindro' in multigasData) {
          multigasData.o2_cilindro = multigasData.O2_cilindro;
          delete multigasData.O2_cilindro;
        }
        if ('H2S_cilindro' in multigasData) {
          multigasData.h2s_cilindro = multigasData.H2S_cilindro;
          delete multigasData.H2S_cilindro;
        }
        if ('CO_cilindro' in multigasData) {
          multigasData.co_cilindro = multigasData.CO_cilindro;
          delete multigasData.CO_cilindro;
        }
        // Usa dataToUpdate mapeado para multigas
        Object.assign(dataToUpdate, multigasData);
        break;
      }
      case 'camara_espuma':
        tableName = 'inventario_camaras_espuma';
        idColumn = 'id_camara';
        // Se numero_mcs for "outro", usa o valor de numero_mcs_custom
        if (dataToUpdate.numero_mcs === 'outro' && (dataToUpdate as any).numero_mcs_custom) {
          dataToUpdate.numero_mcs = (dataToUpdate as any).numero_mcs_custom;
          delete (dataToUpdate as any).numero_mcs_custom;
        }
        break;
      case 'canhao_monitor':
        tableName = 'inventario_canhoes_monitores';
        idColumn = 'id_equipamento';
        break;
      case 'chuveiro_lavaolhos':
        tableName = 'inventario_chuveiros_lava_olhos';
        idColumn = 'id_equipamento';
        break;
      case 'alarme':
        tableName = 'inventario_alarmes';
        idColumn = 'id_sistema';
        break;
      case 'abrigo':
        tableName = 'abrigos';
        idColumn = 'id_abrigo';
        break;
      default:
        // Verifica se é tipo customizado
        if (type.startsWith('custom-')) {
          try {
            const { getAllCustomEquipmentTypes } = await import('../utils/customEquipmentOperations');
            const slug = type.replace('custom-', '');
            const customTypes = await getAllCustomEquipmentTypes();
            const foundType = customTypes.find(t => t.slug === slug);
            
            if (foundType) {
              // Atualiza equipamento customizado
              const { supabase } = await import('../lib/supabase');
              const { error } = await supabase
                .from('custom_equipment' as any)
                .update({
                  ...dataToUpdate,
                  custom_fields: formData.custom_fields || {},
                  updated_at: new Date().toISOString(),
                })
                .eq('equipment_type_id', foundType.id)
                .eq('id_equipamento', id);
              
              if (error) throw error;
              
              // Atualiza cache e navega
              try {
                await refreshCache();
              } catch (error) {
                logger.error('Erro ao atualizar cache', 'equipment', error);
              }
              navigate(returnAfterSave ?? `/equipment/${type}/${id}`);
              setLoading(false);
              return;
            }
          } catch (error: any) {
            handleError(error, 'equipment', 'Erro ao atualizar equipamento customizado');
            setLoading(false);
            return;
          }
        }
        setLoading(false);
        return;
    }

    const success = await executeWithFeedback(
      async () => {
        const { error } = await supabase
          .from(tableName as any)
          .update(dataToUpdate)
          .eq(idColumn, id);
        if (error) throw error;
        return true;
      },
      'equipment',
      'Equipamento atualizado com sucesso!',
      'Falha ao atualizar equipamento'
    );

    if (success) {
      // Atualiza o cache imediatamente para que as alterações apareçam na lista
      try {
        await refreshCache();
      } catch (error) {
        // Log do erro mas não impede a navegação
        logger.error('Erro ao atualizar cache', 'equipment', error);
      }
      navigate(returnAfterSave ?? `/equipment/${type}/${id}`);
    }
    
    setLoading(false);
  };

  const renderSpecificForm = () => {
    if (!type) return null;
    
    if (isCustomType && customTypeId) {
      return <CustomEquipmentForm equipmentTypeId={customTypeId} register={register} errors={errors} watch={watch} />;
    }
    
    switch (type) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} watch={watch} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      case 'multigas':
        return <MultigasForm register={register} />;
      case 'camara_espuma':
        return <FoamChamberForm register={register} errors={errors} watch={watch} />;
      case 'canhao_monitor':
        return <CannonMonitorForm register={register} watch={watch} />;
      case 'chuveiro_lavaolhos':
        return <EyewashForm register={register} />;
      case 'alarme':
        return <AlarmForm register={register} />;
      case 'abrigo':
        return <ShelterForm register={register} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'equipment.edit', defaultValue: 'Editar Equipamento' }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <InstructionsPanel equipmentType={instructionType} className="mb-6" />
        {loadingData ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : equipmentData ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Campo de número de série para tipos customizados */}
            {isCustomType && (
              <div className="mb-4">
                <label htmlFor="numero_serie" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  {t('equipment.serialNumber', { defaultValue: 'Nº de Série' })} <span className="text-gray-400 text-xs">{t('equipment.formHints.optional')}</span>
                </label>
                <input
                  id="numero_serie"
                  type="text"
                  placeholder="Ex: SN123456"
                  {...register('numero_serie')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" 
                  style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                />
              </div>
            )}
            {renderSpecificForm()}

            <button
              type="submit"
              disabled={loading}
              onClick={() => haptics.medium()}
              className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </form>
        ) : (
          <p className="text-center text-status-error">{t('equipment.noEquipment')}</p>
        )}
      </main>
    </div>
  );
};

export default EditEquipmentPage;
