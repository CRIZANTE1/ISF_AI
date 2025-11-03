import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import MultigasForm from '../components/forms/MultigasForm';
import FoamChamberForm from '../components/forms/FoamChamberForm';
import CannonMonitorForm from '../components/forms/CannonMonitorForm';
import EyewashForm from '../components/forms/EyewashForm';
import AlarmForm from '../components/forms/AlarmForm';
import ShelterForm from '../components/forms/ShelterForm';
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

const EditEquipmentPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentData, setEquipmentData] = useState<EquipmentData | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EquipmentData>();

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id || !type) return;
      setLoadingData(true);
      setError(null);

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
        }

        if (!data) {
          setError('Equipamento não encontrado.');
        } else {
          setEquipmentData(data);
          reset(data);
        }
      } catch (err: any) {
        setError('Erro ao buscar equipamento.');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchEquipment();
  }, [id, type, reset]);

  const onSubmit = async (formData: EquipmentData) => {
    if (!id || !type) return;
    setLoading(true);
    setError(null);

    try {
      let tableName = '';
      let idColumn = '';
      const { id: _, created_at, user_id, ...dataToUpdate } = formData;

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
        case 'multigas':
          tableName = 'inventario_multigas';
          idColumn = 'id_equipamento';
          break;
        case 'camara_espuma':
          tableName = 'inventario_camaras_espuma';
          idColumn = 'id_camara';
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
          throw new Error('Tipo de equipamento desconhecido.');
      }

      const { error } = await supabase
        .from(tableName as any)
        .update(dataToUpdate)
        .eq(idColumn, id);

      if (error) throw error;
      navigate(`/equipment/${type}/${id}`);
    } catch (err: any) {
      setError('Falha ao atualizar equipamento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificForm = () => {
    if (!type) return null;
    
    switch (type) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      case 'multigas':
        return <MultigasForm register={register} />;
      case 'camara_espuma':
        return <FoamChamberForm register={register} />;
      case 'canhao_monitor':
        return <CannonMonitorForm register={register} />;
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
    <div className="min-h-screen">
      <PageHeader title="Editar Equipamento" />
      <main className="p-4">
        {loadingData ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : equipmentData ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderSpecificForm()}

            {error && <p className="mb-4 text-center text-status-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-accent-cyan text-white font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        ) : (
          <p className="text-center text-status-error">Equipamento não encontrado.</p>
        )}
      </main>
    </div>
  );
};

export default EditEquipmentPage;
