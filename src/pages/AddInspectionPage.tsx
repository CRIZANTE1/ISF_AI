import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentLocation } from '../hooks/useGeolocation';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import AnimatedFormField from '../components/AnimatedFormField';
import PhotoUpload from '../components/PhotoUpload';
import InstructionsPanel from '../components/InstructionsPanel';
import EyewashChecklist from '../components/checklists/EyewashChecklist';
import FoamChamberChecklist from '../components/checklists/FoamChamberChecklist';
import AlarmChecklist from '../components/checklists/AlarmChecklist';
import CannonMonitorChecklist from '../components/checklists/CannonMonitorChecklist';
import ScbaChecklist from '../components/checklists/ScbaChecklist';
import { 
  generateActionPlan, 
  calculateNextDates,
  type InspectionRecord,
  type EquipmentDates,
  saveExtinguisherInspection,
  getExtinguisherById,
} from '../utils/extinguisherOperations';
import { saveEyewashInspection, generateEyewashActionPlan, getAllEyewashStations } from '../utils/eyewashOperations';
import { saveFoamChamberInspection, getAllFoamChambers } from '../utils/foamChamberOperations';
import { saveAlarmInspection, getAllAlarmSystems } from '../utils/alarmOperations';
import { saveCannonMonitorInspection, getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { saveMultigasInspection, getAllMultigasDetectors, getMultigasDetectorById, updateCylinderValues, verifyBumpTest } from '../utils/multigasOperations';
import type { CylinderValues } from '../utils/multigasOperations';
import { saveSCBAVisualInspection, getAllSCBAs, getSCBABySerial } from '../utils/scbaOperations';
import { saveShelterInspection, getAllShelters } from '../utils/shelterOperations';
import { uploadEvidencePhoto } from '../utils/storage';
import { Spinner } from '../components/ui/spinner';

type AddInspectionFormData = {
  data_inspecao?: string;
  tipo_servico?: string;
  tipo_inspecao?: string;
  aprovado_inspecao?: string;
  status_geral?: string;
  observacoes_gerais?: string;
  foto_nao_conformidade?: File | null;
  resultados_json?: Record<string, any>;
};

type EquipmentInfo = {
  id: string;
  name: string;
  location?: string;
  localizacao?: string;
  model?: string;
  modelo?: string;
  [key: string]: any;
};

const AddInspectionPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, executeWithFeedback } = useErrorHandler();
  const { getEquipmentByType } = useEquipmentCache();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [planAction, setPlanAction] = useState<string>('');
  const [checklistResults, setChecklistResults] = useState<Record<string, string>>({});
  const [checklistObservations, setChecklistObservations] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [foamChamberInspectionType, setFoamChamberInspectionType] = useState<'Visual Semestral' | 'Funcional Anual'>('Visual Semestral');
  const [cannonMonitorInspectionType, setCannonMonitorInspectionType] = useState<'Visual' | 'Funcional'>('Visual');
  
  // Multigas form fields
  const [multigasTestType, setMultigasTestType] = useState<'Periódico' | 'Extraordinário'>('Periódico');
  const [multigasReferenceLEL, setMultigasReferenceLEL] = useState<string>('');
  const [multigasReferenceO2, setMultigasReferenceO2] = useState<string>('');
  const [multigasReferenceH2S, setMultigasReferenceH2S] = useState<string>('');
  const [multigasReferenceCO, setMultigasReferenceCO] = useState<string>('');
  const [multigasFoundLEL, setMultigasFoundLEL] = useState<string>('');
  const [multigasFoundO2, setMultigasFoundO2] = useState<string>('');
  const [multigasFoundH2S, setMultigasFoundH2S] = useState<string>('');
  const [multigasFoundCO, setMultigasFoundCO] = useState<string>('');
  const [multigasTestTime, setMultigasTestTime] = useState<string>('');
  const [multigasUpdateCylinder, setMultigasUpdateCylinder] = useState<boolean>(false);
  
  // Estado para geolocalização
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, control } = useForm<AddInspectionFormData>({
    defaultValues: {
      data_inspecao: new Date().toISOString().split('T')[0],
      tipo_servico: 'Inspeção',
      aprovado_inspecao: 'Sim',
      status_geral: 'Aprovado',
    }
  });

  const aprovado = watch('aprovado_inspecao');
  const observacoes = watch('observacoes_gerais');

  // Captura geolocalização automaticamente quando a página carrega
  useEffect(() => {
    const captureLocation = async () => {
      // Tipos de equipamentos que precisam de geolocalização
      const needsLocation = ['extintor', 'abrigo', 'canhao_monitor', 'camara_espuma', 'chuveiro_lavaolhos', 'alarme'].includes(type || '');
      
      if (needsLocation) {
        try {
          const location = await getCurrentLocation();
          if (location) {
            setLatitude(location.latitude);
            setLongitude(location.longitude);
            setLocationError(null);
          } else {
            setLocationError('Não foi possível obter a localização. Verifique as permissões do dispositivo/navegador.');
          }
        } catch (err: any) {
          setLocationError(err.message || 'Erro ao obter localização');
        }
      }
    };

    captureLocation();
  }, [type]);

  // Busca informações do equipamento baseado no tipo
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id || !type) {
        setLoadingEquipment(false);
        return;
      }
      setLoadingEquipment(true);

      try {
        let equipmentData: EquipmentInfo | null = null;

        switch (type) {
          case 'extintor':
            const extData = await getExtinguisherById(id);
            if (extData) {
              equipmentData = {
                id: extData.numero_identificacao,
                name: extData.numero_identificacao,
                location: extData.local_id || undefined,
              };
            }
            break;
          case 'chuveiro_lavaolhos':
            // Usar cache em vez de buscar todos
            const eyewashStations = getEquipmentByType('chuveiro_lavaolhos');
            const eyewashData = eyewashStations.find((e: any) => e.id_equipamento === id);
            if (eyewashData) {
              equipmentData = {
                id: eyewashData.id_equipamento,
                name: eyewashData.id_equipamento,
                location: eyewashData.localizacao,
              };
            }
            break;
          case 'camara_espuma':
            // Usar cache em vez de buscar todos
            const foamChambers = getEquipmentByType('camara_espuma');
            const foamData = foamChambers.find((e: any) => e.id_camara === id);
            if (foamData) {
              equipmentData = {
                id: foamData.id_camara,
                name: foamData.id_camara,
                location: foamData.localizacao,
                model: foamData.modelo,
              };
            }
            break;
          case 'alarme':
            // Usar cache em vez de buscar todos
            const alarmSystems = getEquipmentByType('alarme');
            const alarmData = alarmSystems.find((e: any) => e.id_sistema === id);
            if (alarmData) {
              equipmentData = {
                id: alarmData.id_sistema,
                name: alarmData.id_sistema,
                location: alarmData.localizacao,
              };
            }
            break;
          case 'canhao_monitor':
            // Usar cache em vez de buscar todos
            const cannonMonitors = getEquipmentByType('canhao_monitor');
            const cannonData = cannonMonitors.find((e: any) => e.id_equipamento === id);
            if (cannonData) {
              equipmentData = {
                id: cannonData.id_equipamento,
                name: cannonData.id_equipamento,
                location: cannonData.localizacao,
              };
            }
            break;
          case 'multigas':
            const multigasData = await getMultigasDetectorById(id);
            if (multigasData) {
              equipmentData = {
                id: multigasData.id_equipamento,
                name: multigasData.id_equipamento,
                location: multigasData.localizacao,
                marca: multigasData.marca,
                modelo: multigasData.modelo,
                numero_serie: multigasData.numero_serie,
                LEL_cilindro: multigasData.LEL_cilindro,
                O2_cilindro: multigasData.O2_cilindro,
                H2S_cilindro: multigasData.H2S_cilindro,
                CO_cilindro: multigasData.CO_cilindro,
              };
              // Carregar valores de referência do cilindro
              setMultigasReferenceLEL(multigasData.LEL_cilindro?.toString() || '');
              setMultigasReferenceO2(multigasData.O2_cilindro?.toString() || '');
              setMultigasReferenceH2S(multigasData.H2S_cilindro?.toString() || '');
              setMultigasReferenceCO(multigasData.CO_cilindro?.toString() || '');
            }
            break;
          case 'scba':
            const scbaData = await getSCBABySerial(id);
            if (scbaData) {
              equipmentData = {
                id: scbaData.numero_serie_equipamento,
                name: scbaData.numero_serie_equipamento,
                location: undefined,
              };
            }
            break;
          case 'abrigo':
            // Usar cache em vez de buscar todos
            const shelters = getEquipmentByType('abrigo');
            const shelterData = shelters.find((s: any) => s.id_abrigo === id);
            if (shelterData) {
              equipmentData = {
                id: shelterData.id_abrigo,
                name: shelterData.id_abrigo,
                location: shelterData.local,
              };
            }
            break;
        }

        if (!equipmentData) {
          handleError(
            new Error(`Equipamento não encontrado: ${id}`),
            'equipment',
            `Equipamento não encontrado. Verifique se o ID '${id}' está correto.`
          );
        } else {
          setEquipment(equipmentData);
        }
      } catch (err: any) {
        console.error('Erro ao buscar equipamento:', err);
        handleError(err, 'equipment', 'Falha ao buscar informações do equipamento.');
      } finally {
        setLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, [id, type]);

  // Gera plano de ação para extintores
  useEffect(() => {
    if (type === 'extintor' && aprovado && observacoes !== undefined) {
      const record: InspectionRecord = {
        aprovado_inspecao: aprovado,
        observacoes_gerais: observacoes || ''
      };
      const plan = generateActionPlan(record);
      setPlanAction(plan);
    }
  }, [aprovado, observacoes, type]);

  // Gera plano de ação para equipamentos com checklist
  useEffect(() => {
    if (type === 'chuveiro_lavaolhos') {
      const nonConformities = Object.entries(checklistResults)
        .filter(([_, status]) => status === 'Não Conforme')
        .map(([question, _]) => question);
      const plan = generateEyewashActionPlan(nonConformities);
      setPlanAction(plan);
    }
  }, [checklistResults, type]);

  const handleChecklistChange = (question: string, value: string) => {
    setChecklistResults(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const onSubmit = async (formData: AddInspectionFormData) => {
    if (!user || !id || !type || !equipment) return;
    setLoading(true);

    try {
      const inspectionDate = formData.data_inspecao || new Date().toISOString().split('T')[0];
      let photoLink: string | null = null;

      // Faz upload da foto se houver
      if (photoFile) {
        const folderMap: Record<string, string> = {
          extintor: 'nao_conformidade_extintor',
          chuveiro_lavaolhos: 'nao_conformidade_chuveiro',
          camara_espuma: 'nao_conformidade_camara_espuma',
          alarme: 'nao_conformidade_alarme',
          canhao_monitor: 'nao_conformidade_canhao_monitor',
          multigas: 'nao_conformidade_multigas',
          scba: 'nao_conformidade_scba',
          abrigo: 'nao_conformidade_abrigo',
        };
        const uploadResult = await uploadEvidencePhoto(photoFile, id, folderMap[type] || 'nao_conformidade');
        photoLink = uploadResult?.url || null;
      }

      // Determina status geral baseado nos resultados do checklist ou aprovação direta
      const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme' || status === 'Reprovado' || status === 'N/C');
      const hasChecklistForType = ['chuveiro_lavaolhos', 'camara_espuma', 'alarme', 'canhao_monitor', 'scba'].includes(type || '');
      const overallStatus = hasChecklistForType
        ? (nonConformities.length > 0 ? 'Reprovado com Pendências' : 'Aprovado')
        : (aprovado === 'Não' || aprovado === 'Reprovado' ? 'Reprovado' : 'Aprovado');

      switch (type) {
        case 'extintor': {
          // Busca último registro para preservar datas
          const lastRecord = await getExtinguisherById(id);
          const existingDates: EquipmentDates = {
            data_proxima_manutencao_2_nivel: lastRecord?.data_proxima_manutencao_2_nivel || null,
            data_proxima_manutencao_3_nivel: lastRecord?.data_proxima_manutencao_3_nivel || null,
            data_ultimo_ensaio_hidrostatico: lastRecord?.data_ultimo_ensaio_hidrostatico || null,
          };

          const nextDates = calculateNextDates(
            inspectionDate,
            formData.tipo_servico || 'Inspeção',
            existingDates
          );

          // Converte null para undefined nas datas
          const cleanDates = Object.fromEntries(
            Object.entries(nextDates).map(([key, value]) => [key, value ?? undefined])
          );

          const inspectionRecord = {
            numero_identificacao: id,
            tipo_servico: formData.tipo_servico || 'Inspeção',
            data_servico: inspectionDate,
            inspetor_responsavel: user.user_metadata?.full_name || user.email || 'Usuário',
            aprovado_inspecao: aprovado || 'Sim',
            observacoes_gerais: observacoes || '',
            plano_de_acao: planAction,
            link_foto_nao_conformidade: photoLink || undefined,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            ...cleanDates,
            user_id: user.id,
          };

          const success = await saveExtinguisherInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'chuveiro_lavaolhos': {
          const inspectionRecord = {
            id_equipamento: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveEyewashInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'camara_espuma': {
          const inspectionRecord = {
            id_camara: id,
            data_inspecao: inspectionDate,
            tipo_inspecao: foamChamberInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: foamChamberInspectionType === 'Funcional Anual'
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveFoamChamberInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'alarme': {
          const inspectionRecord = {
            id_sistema: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveAlarmInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'canhao_monitor': {
          const inspectionRecord = {
            id_equipamento: id,
            data_inspecao: inspectionDate,
            tipo_inspecao: cannonMonitorInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveCannonMonitorInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'multigas': {
          // Preparar valores de referência e encontrados
          const referenceValues: CylinderValues = {
            LEL: parseFloat(multigasReferenceLEL) || 0,
            O2: parseFloat(multigasReferenceO2) || 0,
            H2S: parseInt(multigasReferenceH2S) || 0,
            CO: parseInt(multigasReferenceCO) || 0,
          };

          const foundValues: CylinderValues = {
            LEL: parseFloat(multigasFoundLEL) || 0,
            O2: parseFloat(multigasFoundO2) || 0,
            H2S: parseInt(multigasFoundH2S) || 0,
            CO: parseInt(multigasFoundCO) || 0,
          };

          // Verificar bump test automaticamente
          const { isApproved, observations } = verifyBumpTest(referenceValues, foundValues);
          const autoObservations = observations.join(' ');

          // Atualizar valores de referência do cilindro se solicitado
          if (multigasUpdateCylinder) {
            const updateSuccess = await updateCylinderValues(id, referenceValues);
            if (!updateSuccess) {
              throw new Error('Falha ao atualizar valores de referência do cilindro');
            }
          }

          const inspectionRecord = {
            id_equipamento: id,
            data_teste: inspectionDate,
            tipo_teste: multigasTestType,
            resultado_teste: isApproved ? 'Aprovado' : 'Reprovado',
            LEL_referencia: referenceValues.LEL || undefined,
            O2_referencia: referenceValues.O2 || undefined,
            H2S_referencia: referenceValues.H2S || undefined,
            CO_referencia: referenceValues.CO || undefined,
            LEL_encontrado: foundValues.LEL || undefined,
            O2_encontrado: foundValues.O2 || undefined,
            H2S_encontrado: foundValues.H2S || undefined,
            CO_encontrado: foundValues.CO || undefined,
            observacoes: autoObservations || observacoes || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proximo_teste: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveMultigasInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'scba': {
          // Estruturar resultados no formato esperado (como no Python)
          const resultsDict: Record<string, any> = {
            Cilindro: {},
            Mascara: {},
            'Testes Funcionais': {},
          };

          // Organizar resultados por seção
          Object.entries(checklistResults).forEach(([key, value]) => {
            if (key.startsWith('Cilindro.')) {
              const item = key.replace('Cilindro.', '');
              resultsDict.Cilindro[item] = value;
            } else if (key.startsWith('Mascara.')) {
              const item = key.replace('Mascara.', '');
              resultsDict.Mascara[item] = value;
            } else if (key.startsWith('Testes Funcionais.')) {
              const item = key.replace('Testes Funcionais.', '');
              resultsDict['Testes Funcionais'][item] = value;
            }
          });

          // Adicionar observações
          if (checklistObservations.Cilindro) {
            resultsDict.Cilindro['Observações'] = checklistObservations.Cilindro;
          }
          if (checklistObservations.Mascara) {
            resultsDict.Mascara['Observações'] = checklistObservations.Mascara;
          }

          const inspectionRecord = {
            numero_serie_equipamento: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            resultados_json: resultsDict,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveSCBAVisualInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'abrigo': {
          const inspectionRecord = {
            id_abrigo: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            resultados_json: checklistResults,
            plano_de_acao: planAction,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveShelterInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        default:
          throw new Error(`Tipo de equipamento '${type}' não suportado para inspeção`);
      }

      navigate(`/inspections/${type}`);
    } catch (err: any) {
      handleError(err, 'inspection', 'Falha ao registrar inspeção');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEquipment) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Registrar Inspeção" />
        <main className="p-4">
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" color="blue" />
          </div>
        </main>
      </div>
    );
  }

  const hasChecklist = ['chuveiro_lavaolhos', 'camara_espuma', 'alarme', 'canhao_monitor', 'scba'].includes(type || '');
  const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme' || status === 'Reprovado' || status === 'N/C');
  const requiresPhoto = nonConformities.length > 0 || (type === 'camara_espuma' && foamChamberInspectionType === 'Funcional Anual');
  const isMultigasEquipment = type === 'multigas';
  const isSimpleSafetyEquipment = ['abrigo'].includes(type || '');

  return (
    <div className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
      <PageHeader title="Registrar Inspeção" />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10, position: 'relative', backgroundColor: '#000000' }}>
        {type && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <InstructionsPanel equipmentType={type} />
          </motion.div>
        )}
        {equipment && (
          <motion.div 
            className="mb-ios-4 p-ios-3 apple-card rounded-ios-lg relative" 
            style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(28, 28, 30, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: '1px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="font-semibold text-sm text-white">{equipment.name}</p>
            <p className="text-xs text-[#8E8E93]">
              {equipment.location || equipment.localizacao || 'Sem localização'}
            </p>
            {equipment.model && (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Modelo: {equipment.model}
              </p>
            )}
          </motion.div>
        )}


        {/* Indicador de geolocalização */}
        {['extintor', 'abrigo', 'canhao_monitor', 'camara_espuma', 'chuveiro_lavaolhos', 'alarme'].includes(type || '') && (
          <motion.div 
            className="mb-4 p-3 rounded-lg border" 
            style={{ 
            backgroundColor: latitude && longitude ? 'rgba(83, 215, 105, 0.1)' : 'rgba(252, 61, 57, 0.1)',
            borderColor: latitude && longitude ? 'rgba(83, 215, 105, 0.3)' : 'rgba(252, 61, 57, 0.3)',
            borderWidth: '1px'
          }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            {latitude && longitude ? (
              <p className="text-sm flex items-center gap-2" style={{ color: '#53D769' }}>
                <span>✓</span>
                <span>Localização capturada: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </p>
            ) : locationError ? (
              <p className="text-sm flex items-center gap-2" style={{ color: '#FC3D39' }}>
                <span>⚠</span>
                <span>{locationError}</span>
              </p>
            ) : (
              <p className="text-sm flex items-center gap-2" style={{ color: '#8E8E93' }}>
                <span>⟳</span>
                <span>Capturando localização...</span>
              </p>
            )}
          </motion.div>
        )}

        <motion.form 
          onSubmit={handleSubmit(onSubmit)} 
          className="relative" 
          style={{ zIndex: 10, position: 'relative' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <AnimatedFormField delay={0.25} className="mb-4">
            <label htmlFor="data_inspecao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              Data da Inspeção *
            </label>
            <input
              type="date"
              id="data_inspecao"
              {...register('data_inspecao', { required: 'Data é obrigatória' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
            />
            {errors.data_inspecao && (
              <p className="text-sm text-status-error mt-1">{errors.data_inspecao.message}</p>
            )}
          </AnimatedFormField>

          {type === 'extintor' && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <label htmlFor="tipo_servico" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  Tipo de Serviço *
                </label>
                <Controller
                  name="tipo_servico"
                  control={control}
                  rules={{ required: 'Tipo de serviço é obrigatório' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="tipo_servico"
                      className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                    >
                      <option value="Inspeção">Inspeção</option>
                      <option value="Manutenção Nível 2">Manutenção Nível 2</option>
                      <option value="Manutenção Nível 3">Manutenção Nível 3</option>
                      <option value="Substituição">Substituição</option>
                    </select>
                  )}
                />
              </AnimatedFormField>

              <AnimatedFormField delay={0.35} className="mb-4">
                <label htmlFor="aprovado_inspecao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  Aprovado na Inspeção? *
                </label>
                <Controller
                  name="aprovado_inspecao"
                  control={control}
                  rules={{ required: 'Aprovação é obrigatória' }}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Sim"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>Sim</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Não"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>Não</span>
                      </label>
                    </div>
                  )}
                />
              </AnimatedFormField>

              <AnimatedFormField delay={0.4} className="mb-4">
                <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  Observações Gerais
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={4}
                  {...register('observacoes_gerais')}
                  placeholder="Descreva problemas encontrados, se houver..."
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                />
              </AnimatedFormField>

              {planAction && (
                <motion.div 
                  className="mb-4 p-3 bg-light-background dark:bg-dark-background rounded-lg border relative" 
                  style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm font-semibold mb-1">Plano de Ação Gerado:</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {planAction}
                  </p>
                </motion.div>
              )}

              {aprovado === 'Não' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  <PhotoUpload
                    value={photoFile}
                    onChange={setPhotoFile}
                    label="Foto de Não Conformidade"
                  />
                </motion.div>
              )}
            </>
          )}

          {type === 'camara_espuma' && (
            <AnimatedFormField delay={0.3} className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Tipo de Inspeção *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Visual Semestral'}
                    onChange={() => setFoamChamberInspectionType('Visual Semestral')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>Visual Semestral</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Funcional Anual'}
                    onChange={() => setFoamChamberInspectionType('Funcional Anual')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>Funcional Anual</span>
                </label>
              </div>
            </AnimatedFormField>
          )}

          {type === 'canhao_monitor' && (
            <AnimatedFormField delay={0.3} className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                Tipo de Inspeção *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Visual'}
                    onChange={() => setCannonMonitorInspectionType('Visual')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>Visual</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Funcional'}
                    onChange={() => setCannonMonitorInspectionType('Funcional')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>Funcional</span>
                </label>
              </div>
            </AnimatedFormField>
          )}

          {isMultigasEquipment && equipment && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
                  Tipo de Teste *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={multigasTestType === 'Periódico'}
                      onChange={() => setMultigasTestType('Periódico')}
                      className="w-4 h-4"
                      style={{ accentColor: '#FFFFFF' }}
                    />
                    <span style={{ color: '#FFFFFF' }}>Periódico</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={multigasTestType === 'Extraordinário'}
                      onChange={() => setMultigasTestType('Extraordinário')}
                      className="w-4 h-4"
                      style={{ accentColor: '#FFFFFF' }}
                    />
                    <span style={{ color: '#FFFFFF' }}>Extraordinário</span>
                  </label>
                </div>
              </AnimatedFormField>

              <AnimatedFormField delay={0.35} className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
                  Hora do Teste
                </label>
                <input
                  type="time"
                  value={multigasTestTime}
                  onChange={(e) => setMultigasTestTime(e.target.value)}
                  className="w-full p-3 rounded-lg relative"                   style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                />
              </AnimatedFormField>

              <motion.div 
                className="mb-4 p-4 rounded-lg relative" 
                style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium" style={{ color: '#B0B0B0' }}>
                    Valores de Referência do Cilindro
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={multigasUpdateCylinder}
                      onChange={(e) => setMultigasUpdateCylinder(e.target.checked)}
                      className="w-4 h-4"
                      style={{ accentColor: '#FFFFFF' }}
                    />
                    <span className="text-xs" style={{ color: '#FFFFFF' }}>Atualizar valores permanentemente</span>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>LEL (% LEL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={multigasReferenceLEL}
                      onChange={(e) => setMultigasReferenceLEL(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>O² (% Vol)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={multigasReferenceO2}
                      onChange={(e) => setMultigasReferenceO2(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>H²S (ppm)</label>
                    <input
                      type="number"
                      value={multigasReferenceH2S}
                      onChange={(e) => setMultigasReferenceH2S(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>CO (ppm)</label>
                    <input
                      type="number"
                      value={multigasReferenceCO}
                      onChange={(e) => setMultigasReferenceCO(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="mb-4 p-4 rounded-lg relative" 
                style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#B0B0B0' }}>
                  Valores Encontrados no Teste
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>LEL</label>
                    <input
                      type="text"
                      value={multigasFoundLEL}
                      onChange={(e) => setMultigasFoundLEL(e.target.value)}
                      placeholder="Ex: 50.0"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>O²</label>
                    <input
                      type="text"
                      value={multigasFoundO2}
                      onChange={(e) => setMultigasFoundO2(e.target.value)}
                      placeholder="Ex: 18.0"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>H²S</label>
                    <input
                      type="text"
                      value={multigasFoundH2S}
                      onChange={(e) => setMultigasFoundH2S(e.target.value)}
                      placeholder="Ex: 25"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>CO</label>
                    <input
                      type="text"
                      value={multigasFoundCO}
                      onChange={(e) => setMultigasFoundCO(e.target.value)}
                      placeholder="Ex: 100"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </motion.div>

              <AnimatedFormField delay={0.5} className="mb-4">
                <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1" style={{ color: '#B0B0B0' }}>
                  Observações Adicionais
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={3}
                  {...register('observacoes_gerais')}
                  placeholder="Observações complementares sobre o teste..."
                  className="w-full p-3 rounded-lg relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                />
              </AnimatedFormField>
            </>
          )}

          {isSimpleSafetyEquipment && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <label htmlFor="aprovado_inspecao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  Status da Inspeção *
                </label>
                <Controller
                  name="aprovado_inspecao"
                  control={control}
                  rules={{ required: 'Status é obrigatório' }}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Aprovado"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>Aprovado</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Reprovado"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>Reprovado</span>
                      </label>
                    </div>
                  )}
                />
              </AnimatedFormField>

              <AnimatedFormField delay={0.35} className="mb-4">
                <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  Observações Gerais
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={4}
                  {...register('observacoes_gerais')}
                  placeholder="Descreva problemas encontrados, se houver..."
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                />
              </AnimatedFormField>

              {aprovado === 'Reprovado' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  <PhotoUpload
                    value={photoFile}
                    onChange={setPhotoFile}
                    label="Foto de Não Conformidade"
                  />
                </motion.div>
              )}
            </>
          )}

          {hasChecklist && (
            <motion.div 
              className="mb-6 relative" 
              style={{ zIndex: 10, position: 'relative' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary" style={{ color: '#FFFFFF' }}>
                Checklist de Inspeção
              </h3>

              {type === 'chuveiro_lavaolhos' && (
                <EyewashChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'camara_espuma' && equipment && (
                <FoamChamberChecklist
                  model={equipment.model}
                  inspectionType={foamChamberInspectionType}
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'alarme' && (
                <AlarmChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'canhao_monitor' && (
                <CannonMonitorChecklist
                  inspectionType={cannonMonitorInspectionType}
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'scba' && (
                <ScbaChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                  onObservationChange={(section, observation) => {
                    setChecklistObservations(prev => ({
                      ...prev,
                      [section]: observation
                    }));
                  }}
                  observations={checklistObservations}
                />
              )}

              {planAction && (
                <motion.div 
                  className="mt-4 p-3 bg-light-background dark:bg-dark-background rounded-lg border relative" 
                  style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm font-semibold mb-1">Plano de Ação Gerado:</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {planAction}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {requiresPhoto && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              {nonConformities.length > 0 ? (
                <motion.div 
                  className="mb-2 p-3 bg-status-warning/20 text-status-warning rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-semibold">
                    {nonConformities.length} não conformidade(s) encontrada(s). Foto obrigatória.
                  </p>
                </motion.div>
              ) : type === 'camara_espuma' && foamChamberInspectionType === 'Funcional Anual' ? (
                <motion.div 
                  className="mb-2 p-3 bg-light-background dark:bg-dark-background rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm">
                    Para Testes Funcionais Anuais, anexe uma foto do equipamento durante o teste.
                  </p>
                </motion.div>
              ) : null}
              <PhotoUpload
                value={photoFile}
                onChange={setPhotoFile}
                label="Foto de Evidência"
                required={requiresPhoto}
              />
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading || (requiresPhoto && !photoFile)}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            style={{ zIndex: 10, position: 'relative' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" color="white" />
                <span>Salvando...</span>
              </div>
            ) : 'Salvar Inspeção'}
          </motion.button>
        </motion.form>
      </main>
    </div>
  );
};

export default AddInspectionPage;
