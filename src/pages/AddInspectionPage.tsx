import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import type { EquipmentTypeKey } from '../types/equipment';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getCurrentLocation } from '../hooks/useGeolocation';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../contexts/ToastContext';
import { useHaptics } from '../hooks/useHaptics';
import AnimatedFormField from '../components/AnimatedFormField';
import PhotoUpload from '../components/PhotoUpload';
import InstructionsPanel from '../components/InstructionsPanel';
import AddInspectionTour from '../components/AddInspectionTour';
import HelpTip from '../components/HelpTip';
import EyewashChecklist from '../components/checklists/EyewashChecklist';
import FoamChamberChecklist from '../components/checklists/FoamChamberChecklist';
import AlarmChecklist from '../components/checklists/AlarmChecklist';
import CannonMonitorChecklist from '../components/checklists/CannonMonitorChecklist';
import ScbaChecklist from '../components/checklists/ScbaChecklist';
import HoseChecklist from '../components/checklists/HoseChecklist';
import CustomChecklist from '../components/checklists/CustomChecklist';
import { getCustomEquipmentTypeById, getAllCustomEquipmentTypes, getAllCustomEquipment, getCustomEquipmentByTypeAndId, saveCustomEquipmentInspection } from '../utils/customEquipmentOperations';
import { logger } from '../utils/logger';
import { 
  notifyInspectionCreated,
  notifyInspectionUpdated,
  notifyEquipmentNonCompliant
} from '../utils/notificationUtils';
import { 
  generateActionPlan, 
  calculateNextDates,
  type InspectionRecord,
  type EquipmentDates,
  saveExtinguisherInspection,
  getExtinguisherById,
  getLastExtinguisherInspection,
  ACTION_MAP,
  getActionKeywords,
} from '../utils/extinguisherOperations';
import { saveEyewashInspection, generateEyewashActionPlan } from '../utils/eyewashOperations';
import { saveFoamChamberInspection } from '../utils/foamChamberOperations';
import { saveAlarmInspection } from '../utils/alarmOperations';
import { saveCannonMonitorInspection, generateCannonMonitorActionPlan } from '../utils/cannonMonitorOperations';
import { saveMultigasInspection, getMultigasDetectorById, updateCylinderValues, updateCylinderTolerances, verifyBumpTest, generateMultigasActionPlan, resolveGasTolerances } from '../utils/multigasOperations';
import type { CylinderValues, GasTolerances } from '../utils/multigasOperations';
import { evaluateCo2Weighing, getNextPesagemDate, CO2_AGENT_VALUE } from '../utils/co2Weighing';
import ChecklistLocationMap from '../components/ChecklistLocationMap';
import { saveSCBAVisualInspection, getSCBABySerial } from '../utils/scbaOperations';
import { saveShelterInspection } from '../utils/shelterOperations';
import { getHoseById, saveHoseInspection } from '../utils/hoseOperations';
import { uploadEvidencePhoto } from '../utils/storage';
import { FormSkeleton, ButtonSkeleton } from '../components/skeletons';
import { Edit } from 'lucide-react';
import { 
  extinguisherInspectionSchema, 
  multigasInspectionSchema, 
  scbaInspectionSchema,
  safeValidateData 
} from '../utils/validation/schemas';
import { 
  EYEWASH_CHECKLIST, 
  FOAM_CHAMBER_CHECKLIST, 
  ALARM_CHECKLIST, 
  CANNON_MONITOR_CHECKLIST_VISUAL, 
  CANNON_MONITOR_CHECKLIST_FUNCIONAL,
  HOSE_CHECKLIST 
} from '../constants/checklists';
import { convertDateTimeLocalToISOWithTimezone } from '../utils/dateUtils';

// Helper para converter File para Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper para converter Base64 para File
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

type AddInspectionFormData = {
  data_inspecao?: string;
  tipo_servico?: string;
  tipo_inspecao?: string;
  aprovado_inspecao?: string;
  status_geral?: string;
  observacoes_gerais?: string;
  foto_nao_conformidade?: File | null;
  resultados_json?: Record<string, any>;
  numero_selo_inmetro?: string; // Número do selo do Inmetro (atualizado em manutenções nível 2 ou 3)
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
  const { handleError } = useErrorHandler();
  const { getEquipmentByType, refreshCache, refreshTypes } = useEquipmentCache();
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const haptics = useHaptics();
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
  const [multigasMarginLEL, setMultigasMarginLEL] = useState<string>('');
  const [multigasMarginO2, setMultigasMarginO2] = useState<string>('');
  const [multigasMarginH2S, setMultigasMarginH2S] = useState<string>('');
  const [multigasMarginCO, setMultigasMarginCO] = useState<string>('');
  const [co2PerformWeighing, setCo2PerformWeighing] = useState(false);
  const [co2PesoMedido, setCo2PesoMedido] = useState<string>('');
  
  // Estado para geolocalização
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Estado para tipos customizados
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeId, setCustomTypeId] = useState<string | null>(null);
  const [customEquipment, setCustomEquipment] = useState<any>(null);

  const getStorageKey = useCallback(() => {
    if (!type || !id) return null;
    return `inspectionFormState_${type}_${id}`;
  }, [type, id]);
  
  // Formata data e hora atual para datetime-local (YYYY-MM-DDTHH:mm)
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const { register, handleSubmit, formState: { errors }, watch, control, setValue, getValues, reset } = useForm<AddInspectionFormData>({
    defaultValues: {
      data_inspecao: getCurrentDateTimeLocal(),
      tipo_servico: 'Inspeção',
      aprovado_inspecao: 'Sim',
      status_geral: 'Aprovado',
    }
  });

    // Lógica de persistência de estado
    useEffect(() => {
      const storageKey = getStorageKey();
      if (!storageKey || !Capacitor.isNativePlatform()) return;
  
      const saveState = async () => {
        try {
          const formValues = getValues();
          let photoBase64: string | null = null;
          if (photoFile) {
            photoBase64 = await fileToBase64(photoFile);
          }
  
          const stateToSave = {
            formValues,
            planAction,
            checklistResults,
            checklistObservations,
            photoFile: photoFile ? { name: photoFile.name, base64: photoBase64 } : null,
            foamChamberInspectionType,
            cannonMonitorInspectionType,
            multigasTestType,
            multigasReferenceLEL,
            multigasReferenceO2,
            multigasReferenceH2S,
            multigasReferenceCO,
            multigasFoundLEL,
            multigasFoundO2,
            multigasFoundH2S,
            multigasFoundCO,
            multigasTestTime,
            multigasUpdateCylinder,
            multigasMarginLEL,
            multigasMarginO2,
            multigasMarginH2S,
            multigasMarginCO,
            co2PerformWeighing,
            co2PesoMedido,
            latitude,
            longitude,
          };
          sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
          logger.info('Estado do formulário de inspeção salvo.', 'inspection-state');
        } catch (error) {
          logger.error('Erro ao salvar estado do formulário.', 'inspection-state', error);
        }
      };
  
      const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          saveState();
        }
      });
  
      return () => {
        listener.remove();
      };
    }, [
      getStorageKey, getValues, photoFile, planAction, checklistResults, checklistObservations,
      foamChamberInspectionType, cannonMonitorInspectionType, multigasTestType,
      multigasReferenceLEL, multigasReferenceO2, multigasReferenceH2S, multigasReferenceCO,
      multigasFoundLEL, multigasFoundO2, multigasFoundH2S, multigasFoundCO,
      multigasTestTime, multigasUpdateCylinder,
      multigasMarginLEL, multigasMarginO2, multigasMarginH2S, multigasMarginCO,
      co2PerformWeighing, co2PesoMedido, latitude, longitude
    ]);

    // Lógica para restaurar estado
    useEffect(() => {
      const storageKey = getStorageKey();
      if (!storageKey) return;
  
      const savedStateJSON = sessionStorage.getItem(storageKey);
      if (savedStateJSON) {
        try {
          const savedState = JSON.parse(savedStateJSON);
          // Se não há data_inspecao salva ou está vazia, usa horário atual do sistema
          if (!savedState.formValues?.data_inspecao) {
            savedState.formValues = {
              ...savedState.formValues,
              data_inspecao: getCurrentDateTimeLocal(),
            };
          }
          reset(savedState.formValues);
          setPlanAction(savedState.planAction);
          setChecklistResults(savedState.checklistResults);
          setChecklistObservations(savedState.checklistObservations);
          if (savedState.photoFile) {
            const restoredFile = base64ToFile(savedState.photoFile.base64, savedState.photoFile.name);
            setPhotoFile(restoredFile);
          }
          setFoamChamberInspectionType(savedState.foamChamberInspectionType);
          setCannonMonitorInspectionType(savedState.cannonMonitorInspectionType);
          setMultigasTestType(savedState.multigasTestType);
          setMultigasReferenceLEL(savedState.multigasReferenceLEL);
          setMultigasReferenceO2(savedState.multigasReferenceO2);
          setMultigasReferenceH2S(savedState.multigasReferenceH2S);
          setMultigasReferenceCO(savedState.multigasReferenceCO);
          setMultigasFoundLEL(savedState.multigasFoundLEL);
          setMultigasFoundO2(savedState.multigasFoundO2);
          setMultigasFoundH2S(savedState.multigasFoundH2S);
          setMultigasFoundCO(savedState.multigasFoundCO);
          setMultigasTestTime(savedState.multigasTestTime);
          setMultigasUpdateCylinder(savedState.multigasUpdateCylinder);
          setMultigasMarginLEL(savedState.multigasMarginLEL ?? savedState.multigasCylinderTolerance ?? '');
          setMultigasMarginO2(savedState.multigasMarginO2 ?? savedState.multigasCylinderTolerance ?? '');
          setMultigasMarginH2S(savedState.multigasMarginH2S ?? savedState.multigasCylinderTolerance ?? '');
          setMultigasMarginCO(savedState.multigasMarginCO ?? savedState.multigasCylinderTolerance ?? '');
          setCo2PerformWeighing(savedState.co2PerformWeighing ?? false);
          setCo2PesoMedido(savedState.co2PesoMedido ?? '');
          setLatitude(savedState.latitude);
          setLongitude(savedState.longitude);
  
          logger.info('Estado do formulário de inspeção restaurado.', 'inspection-state');
        } catch (error) {
          logger.error('Erro ao restaurar estado do formulário.', 'inspection-state', error);
        }
      }
    }, [getStorageKey, reset]);

    // Limpeza do estado ao sair da página
    useEffect(() => {
      const storageKey = getStorageKey();
      return () => {
        if (storageKey) {
          sessionStorage.removeItem(storageKey);
          logger.info('Estado do formulário de inspeção limpo ao sair da página.', 'inspection-state');
        }
      };
    }, [getStorageKey]);

  const aprovado = watch('aprovado_inspecao');
  const observacoes = watch('observacoes_gerais');
  
  // Obtém palavras-chave únicas do ACTION_MAP
  const actionKeywords = getActionKeywords();

  // Verifica se é tipo customizado e carrega dados
  useEffect(() => {
    const checkCustomType = async () => {
      if (!type || !type.startsWith('custom-')) {
        setIsCustomType(false);
        return;
      }

      try {
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
  }, [type, setIsCustomType, setCustomTypeId]);

  // Captura geolocalização automaticamente quando a página carrega
  useEffect(() => {
    const captureLocation = async () => {
      // Tipos de equipamentos que precisam de geolocalização
      const needsLocation = ['extintor', 'abrigo', 'canhao_monitor', 'camara_espuma', 'chuveiro_lavaolhos', 'alarme'].includes(type || '') || isCustomType;
      
      if (needsLocation) {
        try {
          const location = await getCurrentLocation();
          if (location) {
            setLatitude(location.latitude);
            setLongitude(location.longitude);
            setLocationError(null);
          } else {
            setLocationError(t('common.locationError'));
          }
        } catch (err: any) {
          setLocationError(err.message || t('common.locationError'));
        }
      }
    };

    captureLocation();
  }, [type, isCustomType, t]);

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
          case 'extintor': {
            const extData = await getExtinguisherById(id);
            const cachedExt = getEquipmentByType('extintor').find((e) => e.numero_identificacao === id);
            if (extData) {
              equipmentData = {
                id: extData.numero_identificacao,
                name: extData.numero_identificacao,
                location: undefined,
                tipo_agente: extData.tipo_agente,
                capacidade: extData.capacidade,
                peso_cheio_placa_kg: extData.peso_cheio_placa_kg,
                peso_vazio_conjunto_kg: extData.peso_vazio_conjunto_kg,
                latitude: cachedExt?.latitude ?? extData.latitude,
                longitude: cachedExt?.longitude ?? extData.longitude,
              };
            }
            break;
          }
          case 'mangueira': {
            const hoseData = await getHoseById(id);
            if (hoseData) {
              equipmentData = {
                id: hoseData.id_mangueira,
                name: hoseData.id_mangueira,
                location: undefined,
              };
            }
            break;
          }
          case 'chuveiro_lavaolhos': {
            // Usar cache em vez de buscar todos
            const eyewashStations = getEquipmentByType('chuveiro_lavaolhos');
            const eyewashData = eyewashStations.find((e: any) => e.id_equipamento === id);
            if (eyewashData) {
              equipmentData = {
                id: eyewashData.id_equipamento,
                name: eyewashData.id_equipamento,
                location: eyewashData.localizacao,
                latitude: eyewashData.latitude,
                longitude: eyewashData.longitude,
              };
            }
            break;
          }
          case 'camara_espuma': {
            // Usar cache em vez de buscar todos
            const foamChambers = getEquipmentByType('camara_espuma');
            const foamData = foamChambers.find((e: any) => e.id_camara === id);
            if (foamData) {
              equipmentData = {
                id: foamData.id_camara,
                name: foamData.id_camara,
                location: foamData.localizacao,
                model: foamData.modelo,
                latitude: foamData.latitude,
                longitude: foamData.longitude,
              };
            }
            break;
          }
          case 'alarme': {
            // Usar cache em vez de buscar todos
            const alarmSystems = getEquipmentByType('alarme');
            const alarmData = alarmSystems.find((e: any) => e.id_sistema === id);
            if (alarmData) {
              equipmentData = {
                id: alarmData.id_sistema,
                name: alarmData.id_sistema,
                location: alarmData.localizacao,
                latitude: alarmData.latitude,
                longitude: alarmData.longitude,
              };
            }
            break;
          }
          case 'canhao_monitor': {
            // Usar cache em vez de buscar todos
            const cannonMonitors = getEquipmentByType('canhao_monitor');
            const cannonData = cannonMonitors.find((e: any) => e.id_equipamento === id);
            if (cannonData) {
              equipmentData = {
                id: cannonData.id_equipamento,
                name: cannonData.id_equipamento,
                location: cannonData.localizacao,
                latitude: cannonData.latitude,
                longitude: cannonData.longitude,
              };
            }
            break;
          }
          case 'multigas': {
            const multigasData = await getMultigasDetectorById(id);
            if (multigasData) {
              equipmentData = {
                id: multigasData.id_equipamento,
                name: multigasData.id_equipamento,
                location: (multigasData as any).localizacao,
                marca: multigasData.marca || undefined,
                modelo: multigasData.modelo || undefined,
                numero_serie: multigasData.numero_serie,
                LEL_cilindro: multigasData.LEL_cilindro,
                O2_cilindro: multigasData.O2_cilindro,
                H2S_cilindro: multigasData.H2S_cilindro,
                CO_cilindro: multigasData.CO_cilindro,
                margem_erro_cilindro: multigasData.margem_erro_cilindro, // Inclui margem de erro
              };
              // Carregar valores de referência do cilindro
              setMultigasReferenceLEL(multigasData.LEL_cilindro?.toString() || '');
              setMultigasReferenceO2(multigasData.O2_cilindro?.toString() || '');
              setMultigasReferenceH2S(multigasData.H2S_cilindro?.toString() || '');
              setMultigasReferenceCO(multigasData.CO_cilindro?.toString() || '');
              // Carregar margem de erro do cilindro
              const tol = resolveGasTolerances(multigasData);
              setMultigasMarginLEL(tol.LEL.toString());
              setMultigasMarginO2(tol.O2.toString());
              setMultigasMarginH2S(tol.H2S.toString());
              setMultigasMarginCO(tol.CO.toString());
            }
            break;
          }
          case 'scba': {
            const scbaData = await getSCBABySerial(id);
            if (scbaData) {
              equipmentData = {
                id: scbaData.numero_serie_equipamento,
                name: scbaData.numero_serie_equipamento,
                location: undefined,
              };
            }
            break;
          }
          case 'abrigo': {
            // Usar cache em vez de buscar todos
            const shelters = getEquipmentByType('abrigo');
            const shelterData = shelters.find((s: any) => s.id_abrigo === id);
            if (shelterData) {
              equipmentData = {
                id: shelterData.id_abrigo,
                name: shelterData.id_abrigo,
                location: shelterData.local,
                latitude: shelterData.latitude,
                longitude: shelterData.longitude,
              };
            }
            break;
          }
          default: {
            // Verifica se é tipo customizado
            if (isCustomType && customTypeId) {
              try {
                const customEquipments = await getAllCustomEquipment(customTypeId);
                const customEq = customEquipments.find((e: any) => e.id_equipamento === id);
                if (customEq) {
                  setCustomEquipment(customEq);
                  equipmentData = {
                    id: customEq.id_equipamento,
                    name: customEq.id_equipamento,
                    location: customEq.localizacao || undefined,
                    latitude: customEq.latitude,
                    longitude: customEq.longitude,
                  };
                }
              } catch (error) {
                logger.error('Erro ao buscar equipamento customizado', 'equipment', error);
              }
            }
            break;
          }
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
        logger.error('Erro ao buscar equipamento', 'equipment', err);
        handleError(err, 'equipment', 'Falha ao buscar informações do equipamento.');
      } finally {
        setLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, [id, type, isCustomType, customTypeId, getEquipmentByType, handleError]);

  // Inicializa checklist com todos os itens como "Conforme" por padrão
  useEffect(() => {
    if (!type || !equipment) return;

    const initializeChecklist = () => {
      const initialResults: Record<string, string> = {};

      switch (type) {
        case 'chuveiro_lavaolhos': {
          Object.entries(EYEWASH_CHECKLIST).forEach(([_, questions]) => {
            questions.forEach((question) => {
              initialResults[question] = 'Conforme';
            });
          });
          break;
        }

        case 'camara_espuma': {
          const model = equipment.model;
          if (model && FOAM_CHAMBER_CHECKLIST[model]) {
            const checklist = FOAM_CHAMBER_CHECKLIST[model];
            const sections = foamChamberInspectionType === 'Visual Semestral'
              ? Object.keys(checklist).filter(s => s !== 'Teste Funcional')
              : Object.keys(checklist);
            
            sections.forEach((section) => {
              checklist[section].forEach((question) => {
                initialResults[question] = 'Conforme';
              });
            });
          }
          break;
        }

        case 'alarme': {
          Object.entries(ALARM_CHECKLIST).forEach(([_, questions]) => {
            questions.forEach((question) => {
              initialResults[question] = 'Conforme';
            });
          });
          break;
        }

        case 'canhao_monitor': {
          const checklist = cannonMonitorInspectionType === 'Visual'
            ? CANNON_MONITOR_CHECKLIST_VISUAL
            : CANNON_MONITOR_CHECKLIST_FUNCIONAL;
          
          Object.entries(checklist).forEach(([_, questions]) => {
            questions.forEach((question) => {
              initialResults[question] = 'Conforme';
            });
          });
          break;
        }

        case 'mangueira': {
          Object.entries(HOSE_CHECKLIST).forEach(([_, questions]) => {
            questions.forEach((question) => {
              initialResults[question] = 'Conforme';
            });
          });
          break;
        }

        case 'scba': {
          // Testes Funcionais - inicializa como "Aprovado"
          initialResults['Testes Funcionais.Estanqueidade Alta Pressão'] = 'Aprovado';
          initialResults['Testes Funcionais.Alarme de Baixa Pressão'] = 'Aprovado';
          initialResults['Testes Funcionais.Vedação da Máscara'] = 'Aprovado';

          // Itens do Cilindro - inicializa como "C" (Conforme)
          const cilindroItems = [
            'Integridade Cilindro',
            'Registro e Valvulas',
            'Manômetro do Cilindro',
            'Pressão Manômetro',
            'Mangueiras e Conexões',
            'Correias/ Tirantes e Alças'
          ];
          cilindroItems.forEach((item) => {
            initialResults[`Cilindro.${item}`] = 'C';
          });

          // Itens da Máscara - inicializa como "C" (Conforme)
          const mascaraItems = [
            'Integridade da Máscara',
            'Visor ou Lente',
            'Borrachas de Vedação',
            'Conector da válvula de Inalação',
            'Correias/ Tirantes',
            'Fivelas e Alças',
            'Válvula de Exalação'
          ];
          mascaraItems.forEach((item) => {
            initialResults[`Mascara.${item}`] = 'C';
          });
          break;
        }
      }

      // Só atualiza se ainda não houver valores definidos
      if (Object.keys(initialResults).length > 0) {
        setChecklistResults(prev => {
          // Mescla com valores existentes, mas só adiciona novos se não existirem
          const merged = { ...prev };
          Object.entries(initialResults).forEach(([key, value]) => {
            if (!(key in merged)) {
              merged[key] = value;
            }
          });
          return merged;
        });
      }
    };

    initializeChecklist();
  }, [type, equipment, foamChamberInspectionType, cannonMonitorInspectionType]);

  // Limpa observações quando status muda para "Sim"
  useEffect(() => {
    if (type === 'extintor' && aprovado === 'Sim' && observacoes) {
      setValue('observacoes_gerais', '');
    }
  }, [aprovado, type, setValue, observacoes]);

  // Gera plano de ação para extintores automaticamente baseado na seleção
  useEffect(() => {
    if (type === 'extintor') {
      if (aprovado === 'Não' && observacoes) {
        // Busca diretamente no ACTION_MAP pela palavra-chave selecionada
        const selectedKeyword = observacoes.trim();
        if (ACTION_MAP[selectedKeyword]) {
          // Retorna o plano de ação padronizado do ACTION_MAP
          setPlanAction(ACTION_MAP[selectedKeyword]);
        } else {
          // Se não encontrar exatamente, tenta gerar usando a função normal
          const record: InspectionRecord = {
            aprovado_inspecao: aprovado,
            observacoes_gerais: observacoes
          };
          const plan = generateActionPlan(record);
          setPlanAction(plan);
        }
      } else if (aprovado === 'Sim') {
        setPlanAction("Manter em monitoramento periódico.");
      } else {
        setPlanAction('');
      }
    } else {
      // Limpa o plano de ação quando não é extintor
      setPlanAction('');
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
    } else if (type === 'mangueira') {
      const nonConformities = Object.entries(checklistResults)
        .filter(([_, status]) => status === 'Não Conforme')
        .map(([question, _]) => question);
      
      if (nonConformities.length > 0) {
        const plan = `Corrigir os seguintes itens não conformes:\n${nonConformities.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
        setPlanAction(plan);
      } else {
        setPlanAction('Mangueira aprovada. Manter monitoramento periódico.');
      }
    } else if (type === 'canhao_monitor') {
      const nonConformities = Object.entries(checklistResults)
        .filter(([_, status]) => status === 'Não Conforme')
        .map(([question, _]) => question);
      const plan = generateCannonMonitorActionPlan(nonConformities);
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
      // Processa data e hora: converte datetime-local para ISO string preservando timezone local do dispositivo
      // Formato datetime-local: YYYY-MM-DDTHH:mm
      // O horário selecionado pelo usuário (ou capturado do sistema) é preservado com o timezone do dispositivo
      let inspectionDate: string; // Data apenas (para compatibilidade com cálculos)
      let inspectionDateTime: string; // DateTime completo com timezone local
      
      if (formData.data_inspecao) {
        if (formData.data_inspecao.includes('T')) {
          // É datetime-local, converter preservando timezone local do dispositivo
          inspectionDateTime = convertDateTimeLocalToISOWithTimezone(formData.data_inspecao);
          inspectionDate = inspectionDateTime.split('T')[0]; // Extrai data
        } else {
          // Apenas data, adiciona horário 00:00 no timezone local
          inspectionDateTime = convertDateTimeLocalToISOWithTimezone(formData.data_inspecao + 'T00:00');
          inspectionDate = formData.data_inspecao;
        }
      } else {
        // Usar data/hora atual no timezone local do dispositivo
        inspectionDateTime = convertDateTimeLocalToISOWithTimezone(getCurrentDateTimeLocal());
        inspectionDate = inspectionDateTime.split('T')[0];
      }
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
      const hasChecklistForType = ['chuveiro_lavaolhos', 'camara_espuma', 'alarme', 'canhao_monitor', 'scba', 'mangueira'].includes(type || '');
      const overallStatus = hasChecklistForType
        ? (nonConformities.length > 0 ? 'Reprovado com Pendências' : 'Aprovado')
        : (aprovado === 'Não' || aprovado === 'Reprovado' ? 'Reprovado' : 'Aprovado');

      // Variável para armazenar o status final de conformidade
      let finalStatusConformidade: string = overallStatus;

      switch (type) {
        case 'extintor': {
          // Busca última inspeção para preservar datas
          const lastInspection = await getLastExtinguisherInspection(id, user.id);
          const existingDates: EquipmentDates = {
            data_proxima_manutencao_2_nivel: lastInspection?.data_proxima_manutencao_2_nivel || null,
            data_proxima_manutencao_3_nivel: lastInspection?.data_proxima_manutencao_3_nivel || null,
            data_ultimo_ensaio_hidrostatico: lastInspection?.data_ultimo_ensaio_hidrostatico || null,
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

          let extObservacoes = observacoes || '';
          let extAprovado = aprovado || 'Sim';
          const extRecord: Record<string, unknown> = {
            numero_identificacao: id,
            tipo_servico: formData.tipo_servico || 'Inspeção',
            data_servico: inspectionDateTime || inspectionDate,
            numero_selo_inmetro: formData.numero_selo_inmetro || undefined,
            inspetor_responsavel: user.user_metadata?.full_name || user.email || 'Usuário',
            aprovado_inspecao: extAprovado,
            observacoes_gerais: extObservacoes,
            plano_de_acao: planAction,
            link_foto_nao_conformidade: photoLink || undefined,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            ...cleanDates,
            user_id: user.id,
          };

          if (equipment?.tipo_agente === CO2_AGENT_VALUE && co2PerformWeighing && co2PesoMedido) {
            const pc = equipment.peso_cheio_placa_kg;
            const pv = equipment.peso_vazio_conjunto_kg;
            const cap = equipment.capacidade;
            const peso = parseFloat(co2PesoMedido);
            const evalResult = evaluateCo2Weighing(pc, pv, cap, peso);
            extRecord.peso_medido_conjunto_kg = peso;
            extRecord.peso_cheio_placa_snapshot_kg = pc ?? undefined;
            extRecord.carga_nominal_kg = evalResult.cargaNominal ?? undefined;
            extRecord.perda_kg = evalResult.perda;
            extRecord.data_proxima_pesagem_co2 = getNextPesagemDate(inspectionDate);
            const co2Line = `[Pesagem CO₂] PC: ${pc} kg | Medido: ${peso} kg | Perda: ${evalResult.perda} kg | Limite: ${evalResult.limite ?? 'N/A'} kg | ${evalResult.aprovado ? 'Aprovado' : 'Reprovado'}`;
            extObservacoes = extObservacoes ? `${extObservacoes}\n${co2Line}` : co2Line;
            extRecord.observacoes_gerais = extObservacoes;
            if (!evalResult.aprovado) {
              extAprovado = 'Não';
              extRecord.aprovado_inspecao = 'Não';
            }
          }

          const inspectionRecord = extRecord;

          // Valida dados antes de salvar
          const validation = safeValidateData(extinguisherInspectionSchema, inspectionRecord);
          if (!validation.success) {
            logger.error('Dados de inspeção inválidos', 'inspection', { 
              error: validation.error,
              type: 'extintor'
            });
            throw new Error(`Dados inválidos: ${validation.error}`);
          }

          // Converte null para undefined para compatibilidade
          const cleanedData = Object.fromEntries(
            Object.entries(validation.data).map(([key, value]) => [
              key, 
              value === null || value === '' ? undefined : value
            ])
          ) as any;

          const success = await saveExtinguisherInspection(cleanedData);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'chuveiro_lavaolhos': {
          const inspectionRecord = {
            id_equipamento: id,
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Inspeção mensal - calcula 1 mês após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setMonth(nextDate.getMonth() + 1);
              return nextDate.toISOString().split('T')[0];
            })(),
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
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            tipo_inspecao: foamChamberInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setDate(nextDate.getDate() + (foamChamberInspectionType === 'Funcional Anual' ? 365 : 180));
              return nextDate.toISOString().split('T')[0];
            })(),
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
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Teste semanal - calcula 1 semana após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setDate(nextDate.getDate() + 7);
              return nextDate.toISOString().split('T')[0];
            })(),
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
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            tipo_inspecao: cannonMonitorInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Inspeção trimestral - calcula 3 meses após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setMonth(nextDate.getMonth() + 3);
              return nextDate.toISOString().split('T')[0];
            })(),
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

          // Obter margem de erro do cilindro (do campo editável ou do equipamento)
          const gasTolerances: GasTolerances = {
            LEL: multigasMarginLEL ? Number(multigasMarginLEL) : resolveGasTolerances(equipment as any).LEL,
            O2: multigasMarginO2 ? Number(multigasMarginO2) : resolveGasTolerances(equipment as any).O2,
            H2S: multigasMarginH2S ? Number(multigasMarginH2S) : resolveGasTolerances(equipment as any).H2S,
            CO: multigasMarginCO ? Number(multigasMarginCO) : resolveGasTolerances(equipment as any).CO,
          };

          const { isApproved, observations } = verifyBumpTest(
            referenceValues, 
            foundValues, 
            gasTolerances
          );
          const autoObservations = observations.join(' ');
          
          // Armazena o status de conformidade para multigas
          finalStatusConformidade = isApproved ? 'Aprovado' : 'Reprovado';

          // Atualizar valores de referência do cilindro e margem de erro se solicitado
          // Esta operação é opcional e não deve bloquear o salvamento da inspeção
          if (multigasUpdateCylinder) {
            try {
              // Atualiza valores do cilindro
              const updateSuccess = await updateCylinderValues(id, referenceValues, user.id);
              if (!updateSuccess) {
                logger.warn('Falha ao atualizar valores de referência do cilindro, mas continuando com salvamento da inspeção', 'inspection', {
                  id,
                  referenceValues
                });
              }
              
              // Atualiza margem de erro se foi alterada
              await updateCylinderTolerances(id, gasTolerances, user.id);
            } catch (updateError: any) {
              // Log do erro mas não bloqueia o salvamento da inspeção
              logger.error('Erro ao atualizar valores de referência do cilindro ou margem de erro', 'inspection', updateError);
              // Não lança erro - apenas loga o problema
            }
          }

          // Para multigas, usa data e hora se disponível, senão usa apenas data
          // Se tiver datetime completo, usa ele; senão combina data com hora separada se houver
          let multigasTestDateTime: string = inspectionDateTime;
          if (multigasTestTime) {
            // Se há hora separada, combina com a data e converte preservando timezone local
            const combinedDateTime = `${inspectionDate}T${multigasTestTime}`;
            multigasTestDateTime = convertDateTimeLocalToISOWithTimezone(combinedDateTime);
          }
          
          // Agora salvamos o datetime completo (com hora e timezone)
          // O campo data_teste foi alterado para timestamp with time zone no banco
          const dataTesteCompleta = multigasTestDateTime; // Já está em formato ISO com timezone
          
          // Gera plano de ação automaticamente baseado no resultado
          const resultadoTeste = isApproved ? 'Aprovado' : 'Reprovado';
          const planoDeAcao = generateMultigasActionPlan(resultadoTeste, multigasTestType);
          
          // Atualiza o estado do plano de ação para o feedback
          setPlanAction(planoDeAcao);
          
          const inspectionRecord = {
            id_equipamento: id,
            data_teste: dataTesteCompleta, // DateTime completo com timezone
            tipo_teste: multigasTestType,
            resultado_teste: resultadoTeste,
            LEL_referencia: referenceValues.LEL || undefined,
            O2_referencia: referenceValues.O2 || undefined,
            H2S_referencia: referenceValues.H2S || undefined,
            CO_referencia: referenceValues.CO || undefined,
            LEL_encontrado: foundValues.LEL || undefined,
            O2_encontrado: foundValues.O2 || undefined,
            H2S_encontrado: foundValues.H2S || undefined,
            CO_encontrado: foundValues.CO || undefined,
            observacoes: autoObservations || observacoes || undefined,
            plano_de_acao: planoDeAcao,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proximo_teste: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setDate(nextDate.getDate() + 30);
              return nextDate.toISOString().split('T')[0];
            })(),
            user_id: user.id,
          };

          // Valida dados antes de salvar
          const validation = safeValidateData(multigasInspectionSchema, inspectionRecord);
          if (!validation.success) {
            logger.error('Dados de inspeção inválidos', 'inspection', { 
              error: validation.error,
              type: 'multigas'
            });
            throw new Error(`Dados inválidos: ${validation.error}`);
          }

          // Converte null para undefined para compatibilidade
          const cleanedData = Object.fromEntries(
            Object.entries(validation.data).map(([key, value]) => [
              key, 
              value === null || value === '' ? undefined : value
            ])
          ) as any;

          const success = await saveMultigasInspection(cleanedData);
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
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            status_geral: overallStatus,
            resultados_json: resultsDict,
            plano_de_acao: planAction || undefined,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Inspeção mensal - calcula 1 mês após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setMonth(nextDate.getMonth() + 1);
              return nextDate.toISOString().split('T')[0];
            })(),
            user_id: user.id,
          };

          // Valida dados antes de salvar
          const validation = safeValidateData(scbaInspectionSchema, inspectionRecord);
          if (!validation.success) {
            logger.error('Dados de inspeção inválidos', 'inspection', { 
              error: validation.error,
              type: 'scba'
            });
            throw new Error(`Dados inválidos: ${validation.error}`);
          }

          // Converte null para undefined para compatibilidade
          const cleanedData = Object.fromEntries(
            Object.entries(validation.data).map(([key, value]) => [
              key, 
              value === null || value === '' ? undefined : value
            ])
          ) as any;

          const success = await saveSCBAVisualInspection(cleanedData);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'mangueira': {
          // Determina resultado baseado no checklist ou aprovação direta
          const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme');
          const resultado = nonConformities.length > 0 || aprovado === 'Não' || aprovado === 'Reprovado' 
            ? 'Reprovado' 
            : 'Aprovado';
          const statusGeral = nonConformities.length > 0 ? 'Reprovado com Pendências' : 'Aprovado';

          const inspectionRecord = {
            id_mangueira: id,
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            resultado: resultado,
            status_geral: statusGeral,
            plano_de_acao: planAction || undefined,
            resultados_json: Object.keys(checklistResults).length > 0 ? checklistResults : undefined,
            observacoes: observacoes || undefined,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Inspeção anual - calcula 1 ano após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              return nextDate.toISOString().split('T')[0];
            })(),
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveHoseInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'abrigo': {
          const inspectionRecord = {
            id_abrigo: id,
            data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
            status_geral: overallStatus,
            resultados_json: checklistResults,
            plano_de_acao: planAction,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            // Inspeção mensal - calcula 1 mês após a data de inspeção
            data_proxima_inspecao: (() => {
              const nextDate = new Date(inspectionDate);
              nextDate.setMonth(nextDate.getMonth() + 1);
              return nextDate.toISOString().split('T')[0];
            })(),
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            user_id: user.id,
          };

          const success = await saveShelterInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        default:
          // Verifica se é tipo customizado
          if (isCustomType && customTypeId) {
            const inspectionRecord = {
              equipment_type_id: customTypeId,
              id_equipamento: id,
              data_inspecao: inspectionDateTime || inspectionDate, // Usa datetime completo se disponível
              tipo_inspecao: formData.tipo_inspecao || undefined,
              status_geral: overallStatus,
              plano_de_acao: planAction,
              resultados_json: checklistResults,
              link_foto_nao_conformidade: photoLink || undefined,
              inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
              // Inspeção mensal padrão - calcula 1 mês após a data de inspeção
              data_proxima_inspecao: (() => {
                const nextDate = new Date(inspectionDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                return nextDate.toISOString().split('T')[0];
              })(),
              latitude: latitude || undefined,
              longitude: longitude || undefined,
              user_id: user.id,
            };

            const success = await saveCustomEquipmentInspection(inspectionRecord);
            if (!success) throw new Error('Falha ao salvar inspeção');
          } else {
            throw new Error(`Tipo de equipamento '${type}' não suportado para inspeção`);
          }
          break;
      }

      // Disparar evento para atualizar notificações quando uma inspeção é salva
      window.dispatchEvent(new CustomEvent('refresh-alerts'));

      // Verifica se plano de ação foi gerado (não é apenas "Manter em monitoramento")
      // Para multigas, também verifica se foi reprovado (sempre tem plano de ação quando reprovado)
      let hasPlanoAcao = false;
      if (type === 'multigas') {
        // Para multigas, se foi reprovado, sempre tem plano de ação válido
        hasPlanoAcao = !!(finalStatusConformidade === 'Reprovado' || 
          (planAction && 
           planAction.trim() !== '' && 
           !planAction.toLowerCase().includes('manter em monitoramento') &&
           !planAction.toLowerCase().includes('manter monitoramento')));
      } else {
        hasPlanoAcao = !!(planAction && 
          planAction.trim() !== '' && 
          !planAction.toLowerCase().includes('manter em monitoramento') &&
          !planAction.toLowerCase().includes('manter monitoramento'));
      }

      // Monta mensagem de feedback
      let feedbackMessage = `Inspeção salva com sucesso!\n\n`;
      feedbackMessage += `Status: ${finalStatusConformidade}`;
      if (hasPlanoAcao) {
        feedbackMessage += `\n✓ Plano de ação gerado`;
      } else {
        feedbackMessage += `\n• Nenhum plano de ação necessário`;
      }

      showSuccess(feedbackMessage, 6000);

      // Envia notificações
      const equipmentId = id;
      const equipmentType = equipment?.name || type || '';
      const inspectionType = formData.tipo_servico || formData.tipo_inspecao || 
        (type === 'camara_espuma' ? foamChamberInspectionType : 
         type === 'canhao_monitor' ? cannonMonitorInspectionType :
         type === 'multigas' ? multigasTestType : 'Inspeção');
      
      // Notifica criação de inspeção (sempre cria nova, não atualiza)
      if (equipmentId && equipmentType) {
        await notifyInspectionCreated(inspectionType, equipmentId, equipmentType);
      }

      // Notifica se equipamento não está conforme
      if (finalStatusConformidade === 'Reprovado' || 
          finalStatusConformidade === 'Reprovado com Pendências' ||
          finalStatusConformidade.toLowerCase().includes('reprovado') ||
          finalStatusConformidade.toLowerCase().includes('não conforme')) {
        if (equipmentId && equipmentType) {
          await notifyEquipmentNonCompliant(equipmentId, equipmentType);
        }
      }

      // Atualiza o cache imediatamente para que as alterações apareçam na lista
      // Recarrega apenas o tipo modificado (economiza ~90% de tráfego em redes móveis)
      try {
        if (type?.startsWith('custom-')) {
          await refreshCache();
        } else {
          await refreshTypes([type as EquipmentTypeKey]);
        }
      } catch (error) {
        // Log do erro mas não impede a navegação
        logger.error('Erro ao atualizar cache', 'equipment', error);
      }

      // Aguarda um pouco antes de navegar para o usuário ver o feedback
      setTimeout(() => {
        const storageKey = getStorageKey();
        if (storageKey) {
          sessionStorage.removeItem(storageKey);
        }
        navigate(`/inspections/${type}`);
      }, 500);
    } catch (err: any) {
      handleError(err, 'inspection', 'Falha ao registrar inspeção');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEquipment) {
    return (
      <div className="min-h-screen">
        <PageHeader title={{ key: 'inspection.add', defaultValue: 'Registrar Inspeção' }} />
        <main className="p-4">
          <FormSkeleton fields={6} />
        </main>
      </div>
    );
  }

  const hasChecklist = ['chuveiro_lavaolhos', 'camara_espuma', 'alarme', 'canhao_monitor', 'scba', 'mangueira'].includes(type || '') || isCustomType;
  const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme' || status === 'Reprovado' || status === 'N/C');
  // Foto não é obrigatória para extintores, apenas opcional quando reprovado
  const requiresPhoto = nonConformities.length > 0 || (type === 'camara_espuma' && foamChamberInspectionType === 'Funcional Anual') || (type === 'abrigo' && aprovado === 'Reprovado');
  const isMultigasEquipment = type === 'multigas';
  const isSimpleSafetyEquipment = ['abrigo'].includes(type || '');
  // Sempre permite adicionar foto, mesmo em total conformidade
  const canAddPhoto = true;

  return (
    <div className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
      <PageHeader 
        title={t('inspection.register')} 
        help={{
          titleKey: 'help.inspection.title',
          contentKey: 'help.inspection.content'
        }}
      />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10, position: 'relative', backgroundColor: '#000000' }}>
        {type && (
          <motion.div
            data-tour="inspection-flow-instructions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <InstructionsPanel equipmentType={isCustomType ? 'custom' : type} />
          </motion.div>
        )}
        {equipment && (
          <motion.div 
            data-tour="inspection-flow-equipment"
            className="mb-ios-4 p-ios-3 apple-card rounded-ios-lg relative flex items-start justify-between gap-3" 
            style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(28, 28, 30, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: '1px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white">{equipment.name}</p>
              <p className="text-xs text-[#8E8E93]">
                {equipment.location || equipment.localizacao || t('inspection.noLocation')}
              </p>
              {equipment.model && (
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {t('inspection.model')} {equipment.model}
                </p>
              )}
            </div>
            {type && id && (
              <Link
                to={`/equipment/${type}/${id}/edit`}
                state={{ returnAfterSave: `/equipment/${type}/${id}/inspections/new` }}
                className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={t('inspection.editEquipment')}
              >
                <Edit className="w-4 h-4 text-white" />
              </Link>
            )}
          </motion.div>
        )}


        {/* Indicador de geolocalização */}
        {(['extintor', 'abrigo', 'canhao_monitor', 'camara_espuma', 'chuveiro_lavaolhos', 'alarme'].includes(type || '') || isCustomType) && (
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
                <span>{t('inspection.locationCaptured')} {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </p>
            ) : locationError ? (
              <p className="text-sm flex items-center gap-2" style={{ color: '#FC3D39' }}>
                <span>⚠</span>
                <span>{locationError}</span>
              </p>
            ) : (
              <p className="text-sm flex items-center gap-2" style={{ color: '#8E8E93' }}>
                <span>⟳</span>
                <span>{t('inspection.capturingLocation')}</span>
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
          <AnimatedFormField delay={0.25} className="mb-4" data-tour="inspection-flow-datetime">
            <label htmlFor="data_inspecao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('inspection.dateTimeRequired', { defaultValue: 'Data e Hora da Inspeção' })}
            </label>
            <input
              type="datetime-local"
              id="data_inspecao"
              {...register('data_inspecao', { required: t('inspection.dateRequiredError') })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" 
              style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              step="60"
            />
            <p className="text-xs text-[#8E8E93] mt-1">
              {t('inspection.dateTimeHint', { defaultValue: 'Horário capturado automaticamente. Você pode editar se necessário.' })}
            </p>
            {errors.data_inspecao && (
              <p className="text-sm text-status-error mt-1">{errors.data_inspecao.message}</p>
            )}
          </AnimatedFormField>

          {type === 'extintor' && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor="tipo_servico" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {t('inspection.serviceType')}
                  </label>
                  <HelpTip 
                    titleKey="help.serviceType.title"
                    contentKey="help.serviceType.content"
                  />
                </div>
                <Controller
                  name="tipo_servico"
                  control={control}
                  rules={{ required: t('inspection.serviceTypeRequired') }}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="tipo_servico"
                      className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                    >
                      <option value="Inspeção">{t('inspection.serviceTypeInspection')}</option>
                      <option value="Manutenção Nível 2">{t('inspection.serviceTypeMaintenanceN2')}</option>
                      <option value="Manutenção Nível 3">{t('inspection.serviceTypeMaintenanceN3')}</option>
                      <option value="Substituição">{t('inspection.serviceTypeReplacement')}</option>
                    </select>
                  )}
                />
              </AnimatedFormField>

              {/* Campo Nº Selo INMETRO - aparece apenas em manutenções nível 2 ou 3 */}
              {watch('tipo_servico') === 'Manutenção Nível 2' || watch('tipo_servico') === 'Manutenção Nível 3' ? (
                <AnimatedFormField delay={0.33} className="mb-4">
                  <label htmlFor="numero_selo_inmetro" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                    Nº Selo INMETRO
                  </label>
                  <Controller
                    name="numero_selo_inmetro"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="numero_selo_inmetro"
                        type="text"
                        className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
                        style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                        placeholder="Digite o número do selo do INMETRO"
                      />
                    )}
                  />
                </AnimatedFormField>
              ) : null}

              <AnimatedFormField delay={0.35} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor="aprovado_inspecao" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {t('inspection.approvedInspection')}
                  </label>
                  <HelpTip 
                    titleKey="help.approvalStatus.title"
                    contentKey="help.approvalStatus.content"
                  />
                </div>
                <Controller
                  name="aprovado_inspecao"
                  control={control}
                  rules={{ required: t('inspection.approvedRequired') }}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Sim"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>{t('common.yes')}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Não"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>{t('common.no')}</span>
                      </label>
                    </div>
                  )}
                />
              </AnimatedFormField>

              <AnimatedFormField delay={0.4} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor="observacoes_gerais" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {t('inspection.generalObservations')}
                  </label>
                  <HelpTip 
                    titleKey="help.observations.title"
                    contentKey="help.observations.content"
                  />
                </div>
                <Controller
                  name="observacoes_gerais"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="observacoes_gerais"
                      className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" 
                      style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                      disabled={aprovado !== 'Não'}
                    >
                      <option value="">
                        {aprovado === 'Não' ? 'Selecione uma não conformidade...' : 'Selecione "Não" acima para escolher uma não conformidade'}
                      </option>
                      {aprovado === 'Não' && actionKeywords.map((keyword) => (
                        <option key={keyword} value={keyword}>
                          {keyword}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </AnimatedFormField>

              {planAction && planAction !== 'N/A' && (
                <motion.div 
                  className="mb-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border relative" 
                  style={{ zIndex: 10, position: 'relative', borderColor: '#3B82F6', borderWidth: '1px' }}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2" style={{ color: '#60A5FA' }}>
                        {t('inspection.actionPlanGenerated')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: '#E5E7EB' }}>
                        {planAction}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Foto de não conformidade - aparece apenas quando reprovado */}
              {aprovado === 'Não' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PhotoUpload
                      value={photoFile}
                      onChange={setPhotoFile}
                      label={t('inspection.nonConformityPhoto')}
                      required={false}
                    />
                    <HelpTip 
                      titleKey="help.photoRequired.title"
                      contentKey="help.photoRequired.content"
                    />
                  </div>
                </motion.div>
              )}

              {equipment?.tipo_agente === CO2_AGENT_VALUE && (
                <motion.div className="mb-4 p-4 rounded-lg border" style={{ borderColor: '#2A2A2A', backgroundColor: 'rgba(26,26,26,0.95)' }}>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={co2PerformWeighing}
                      onChange={(e) => setCo2PerformWeighing(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-white">
                      {t('extinguisher.co2Weighing.performWeighing', { defaultValue: 'Realizar pesagem semestral CO₂' })}
                    </span>
                  </label>
                  {equipment.peso_cheio_placa_kg != null && (
                    <p className="text-xs text-gray-400 mb-1">
                      PC: {equipment.peso_cheio_placa_kg} kg
                      {equipment.peso_vazio_conjunto_kg != null ? ` | PV: ${equipment.peso_vazio_conjunto_kg} kg` : ''}
                      {equipment.capacidade != null ? ` | Cap: ${equipment.capacidade} kg` : ''}
                    </p>
                  )}
                  {co2PerformWeighing && (
                    <>
                      <label className="block text-xs mb-1 text-gray-400">
                        {t('extinguisher.co2Weighing.measuredWeight', { defaultValue: 'Peso medido do conjunto (kg)' })}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={co2PesoMedido}
                        onChange={(e) => setCo2PesoMedido(e.target.value)}
                        className="w-full p-2 rounded"
                        style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFF' }}
                      />
                      {co2PesoMedido && equipment.peso_cheio_placa_kg != null && (() => {
                        const ev = evaluateCo2Weighing(
                          equipment.peso_cheio_placa_kg,
                          equipment.peso_vazio_conjunto_kg,
                          equipment.capacidade,
                          parseFloat(co2PesoMedido)
                        );
                        return (
                          <p className="text-xs mt-2" style={{ color: ev.aprovado ? '#53D769' : '#FC3D39' }}>
                            {t('extinguisher.co2Weighing.result', { defaultValue: 'Perda' })}: {ev.perda} kg / {t('extinguisher.co2Weighing.limit', { defaultValue: 'Limite' })}: {ev.limite ?? '—'} kg — {ev.aprovado ? t('inspection.approved') : t('inspection.rejected')}
                          </p>
                        );
                      })()}
                    </>
                  )}
                </motion.div>
              )}
            </>
          )}

          {type === 'camara_espuma' && (
            <AnimatedFormField delay={0.3} className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                {t('inspection.inspectionType')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Visual Semestral'}
                    onChange={() => setFoamChamberInspectionType('Visual Semestral')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>{t('inspection.inspectionTypeVisualSemestral')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Funcional Anual'}
                    onChange={() => setFoamChamberInspectionType('Funcional Anual')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>{t('inspection.inspectionTypeFunctionalAnnual')}</span>
                </label>
              </div>
            </AnimatedFormField>
          )}

          {type === 'canhao_monitor' && (
            <AnimatedFormField delay={0.3} className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                {t('inspection.inspectionType')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Visual'}
                    onChange={() => setCannonMonitorInspectionType('Visual')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>{t('inspection.inspectionTypeVisual')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Funcional'}
                    onChange={() => setCannonMonitorInspectionType('Funcional')}
                    className="w-4 h-4"
                  />
                  <span style={{ color: '#FFFFFF' }}>{t('inspection.inspectionTypeFunctional')}</span>
                </label>
              </div>
            </AnimatedFormField>
          )}

          {isMultigasEquipment && equipment && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
                  {t('inspection.testType')}
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
                    <span style={{ color: '#FFFFFF' }}>{t('inspection.testTypePeriodic')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={multigasTestType === 'Extraordinário'}
                      onChange={() => setMultigasTestType('Extraordinário')}
                      className="w-4 h-4"
                      style={{ accentColor: '#FFFFFF' }}
                    />
                    <span style={{ color: '#FFFFFF' }}>{t('inspection.testTypeExtraordinary')}</span>
                  </label>
                </div>
              </AnimatedFormField>

              <AnimatedFormField delay={0.35} className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
                  {t('inspection.testTime')}
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
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium" style={{ color: '#B0B0B0' }}>
                      {t('inspection.referenceValuesTitle')}
                    </label>
                    <HelpTip 
                      titleKey="help.multigasReference.title"
                      contentKey="help.multigasReference.content"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={multigasUpdateCylinder}
                      onChange={(e) => setMultigasUpdateCylinder(e.target.checked)}
                      className="w-4 h-4"
                      style={{ accentColor: '#FFFFFF' }}
                    />
                    <span className="text-xs" style={{ color: '#FFFFFF' }}>{t('inspection.updateValuesPermanently')}</span>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.referenceLEL')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={multigasReferenceLEL}
                      onChange={(e) => setMultigasReferenceLEL(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.referenceO2')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={multigasReferenceO2}
                      onChange={(e) => setMultigasReferenceO2(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.referenceH2S')}</label>
                    <input
                      type="number"
                      value={multigasReferenceH2S}
                      onChange={(e) => setMultigasReferenceH2S(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.referenceCO')}</label>
                    <input
                      type="number"
                      value={multigasReferenceCO}
                      onChange={(e) => setMultigasReferenceCO(e.target.value)}
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#2A2A2A' }}>
                  <label className="block text-xs mb-2" style={{ color: '#9E9E9E' }}>
                    {t('equipment.marginsPerGas')}
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      ['lel', multigasMarginLEL, setMultigasMarginLEL],
                      ['o2', multigasMarginO2, setMultigasMarginO2],
                      ['h2s', multigasMarginH2S, setMultigasMarginH2S],
                      ['co', multigasMarginCO, setMultigasMarginCO],
                    ] as const).map(([gas, value, setter]) => (
                      <div key={gas}>
                        <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>
                          {t(`equipment.gas${({ lel: 'LEL', o2: 'O2', h2s: 'H2S', co: 'CO' } as const)[gas]}`)}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="20.0"
                          className="w-full p-2 rounded"
                          style={{ backgroundColor: 'rgba(18,18,18,0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                        />
                      </div>
                    ))}
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
                  {t('inspection.foundValuesTitle')}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.gasLEL')}</label>
                    <input
                      type="text"
                      value={multigasFoundLEL}
                      onChange={(e) => setMultigasFoundLEL(e.target.value)}
                      placeholder="Ex: 50.0"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.gasO2')}</label>
                    <input
                      type="text"
                      value={multigasFoundO2}
                      onChange={(e) => setMultigasFoundO2(e.target.value)}
                      placeholder="Ex: 18.0"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.gasH2S')}</label>
                    <input
                      type="text"
                      value={multigasFoundH2S}
                      onChange={(e) => setMultigasFoundH2S(e.target.value)}
                      placeholder="Ex: 25"
                      className="w-full p-2 rounded relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9E9E9E' }}>{t('equipment.gasCO')}</label>
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
                  {t('inspection.additionalObservations')}
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={3}
                  {...register('observacoes_gerais')}
                  placeholder={t('inspection.observationsPlaceholderMultigas')}
                  className="w-full p-3 rounded-lg relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
                />
              </AnimatedFormField>
            </>
          )}

          {isSimpleSafetyEquipment && (
            <>
              <AnimatedFormField delay={0.3} className="mb-4">
                <label htmlFor="aprovado_inspecao" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  {t('inspection.statusInspection')}
                </label>
                <Controller
                  name="aprovado_inspecao"
                  control={control}
                  rules={{ required: t('inspection.statusRequired') }}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Aprovado"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>{t('inspection.approved')}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Reprovado"
                          className="w-4 h-4"
                        />
                        <span style={{ color: '#FFFFFF' }}>{t('inspection.rejected')}</span>
                      </label>
                    </div>
                  )}
                />
              </AnimatedFormField>

              <AnimatedFormField delay={0.35} className="mb-4">
                <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
                  {t('inspection.generalObservations')}
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={4}
                  {...register('observacoes_gerais')}
                  placeholder={t('inspection.observationsPlaceholder')}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
                />
              </AnimatedFormField>

              {/* Sempre permite adicionar foto, mesmo quando aprovado */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <PhotoUpload
                  value={photoFile}
                  onChange={setPhotoFile}
                  label={t('inspection.nonConformityPhoto')}
                  required={aprovado === 'Reprovado'}
                />
              </motion.div>
            </>
          )}

          {hasChecklist && (() => {
            // Calcula progresso geral do checklist
            const allQuestions = Object.keys(checklistResults);
            const answered = allQuestions.filter(q => checklistResults[q]).length;
            const total = allQuestions.length;
            const nonConformitiesCount = allQuestions.filter(q => 
              checklistResults[q] === 'Não Conforme' || 
              checklistResults[q] === 'Reprovado' || 
              checklistResults[q] === 'N/C'
            ).length;
            const progress = total > 0 ? (answered / total) * 100 : 0;
            
            return (
              <motion.div 
                className="mb-6 relative" 
                style={{ zIndex: 10, position: 'relative' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                {/* Indicador de progresso geral */}
                <motion.div
                  className="mb-6 p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: '1px',
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>
                        {t('inspection.checklistTitle')}
                      </h3>
                      <HelpTip 
                        titleKey="help.checklist.title"
                        contentKey="help.checklist.content"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: '#B0B0B0' }}>
                        {answered}/{total}
                      </span>
                      {nonConformitiesCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
                          <span>⚠</span>
                          <span>{nonConformitiesCount} {t('inspection.nonConformities', { defaultValue: 'Não Conformes' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progresso geral */}
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: nonConformitiesCount > 0 ? '#FC3D39' : '#53D769',
                        width: `${progress}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#53D769' }} />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>
                        {allQuestions.filter(q => checklistResults[q] === 'Conforme' || checklistResults[q] === 'C' || checklistResults[q] === 'Aprovado').length} {t('checklist.conform', { defaultValue: 'Conforme' })}
                      </span>
                    </div>
                    {nonConformitiesCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FC3D39' }} />
                        <span className="text-xs" style={{ color: '#B0B0B0' }}>
                          {nonConformitiesCount} {t('checklist.nonConform', { defaultValue: 'Não Conforme' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8E8E93' }} />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>
                        {allQuestions.filter(q => checklistResults[q] === 'N/A').length} {t('checklist.notApplicable', { defaultValue: 'N/A' })}
                      </span>
                    </div>
                  </div>
                </motion.div>

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

              {type === 'mangueira' && (
                <HoseChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {isCustomType && customTypeId && (
                <CustomChecklist
                  equipmentTypeId={customTypeId}
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
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
                  <p className="text-sm font-semibold mb-1">{t('inspection.actionPlanGenerated')}</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {planAction}
                  </p>
                </motion.div>
              )}
              </motion.div>
            );
          })()}

          {/* Sempre mostra o campo de foto, mesmo em total conformidade */}
          {(canAddPhoto || requiresPhoto) && (
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
                    {t('inspection.nonConformitiesFound', { count: nonConformities.length })}
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
                    {t('inspection.functionalTestPhotoRequired')}
                  </p>
                </motion.div>
              ) : null}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {t('inspection.evidencePhoto')}
                    {requiresPhoto && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {requiresPhoto && (
                    <HelpTip 
                      titleKey="help.photoRequired.title"
                      contentKey="help.photoRequired.content"
                    />
                  )}
                </div>
                <PhotoUpload
                  value={photoFile}
                  onChange={setPhotoFile}
                  label=""
                  required={requiresPhoto}
                />
              </div>
            </motion.div>
          )}

          <ChecklistLocationMap
            latitude={equipment?.latitude}
            longitude={equipment?.longitude}
            title={equipment?.name}
          />

          <motion.button
            data-tour="inspection-flow-submit"
            type="submit"
            disabled={loading || (requiresPhoto && !photoFile)}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            style={{ zIndex: 10, position: 'relative' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onTap={() => haptics.medium()}
          >
            {loading ? (
              <ButtonSkeleton width="w-28" className="bg-white/20" />
            ) : t('inspection.saveSuccess', { defaultValue: 'Salvar Inspeção' })}
          </motion.button>
        </motion.form>
      </main>
      <AddInspectionTour ready={!loadingEquipment && !!equipment} />
    </div>
  );
};

export default AddInspectionPage;
