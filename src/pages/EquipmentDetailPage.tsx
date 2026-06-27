import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import type { EquipmentTypeKey } from '../types/equipment';
import PageHeader from '../components/PageHeader';
import ConfirmationModal from '../components/ConfirmationModal';
import { DetailSkeleton, IconSkeleton, ButtonSkeleton } from '../components/skeletons';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ProgressiveImage from '../components/ProgressiveImage';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Trash2, Edit, FileText } from 'lucide-react';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';
import { parseInspectionDate } from '../utils/dateUtils';
import { useHaptics } from '../hooks/useHaptics';
import { getExtinguisherById } from '../utils/extinguisherOperations';
import { getHoseById } from '../utils/hoseOperations';
import { getSCBABySerial } from '../utils/scbaOperations';
import { getMultigasDetectorById } from '../utils/multigasOperations';
import { generateInspectionReport, generateMultipleInspectionReport, savePdfToDevice, mapInspectionForPdf, type InspectionData, type EquipmentData } from '../utils/pdfReportGenerator';

type EquipmentInfo = {
  id: string;
  name: string;
  location?: string;
  [key: string]: any;
};

type InspectionInfo = {
  id: number | string;
  data_inspecao: string;
  status_geral?: string | null;
  status?: string;
  notes?: string;
  observacoes_gerais?: string | null;
  plano_de_acao?: string | null;
  link_foto_nao_conformidade?: string | null;
};

const EquipmentDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEquipmentByType, refreshCache, refreshTypes } = useEquipmentCache();
  const { handleError, showSuccess } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const haptics = useHaptics();
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [inspections, setInspections] = useState<InspectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // State for deletion modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'inspection'; id: number | string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for PDF generation
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);
  
  // State for multiple inspection report
  const [showMultipleReportModal, setShowMultipleReportModal] = useState(false);
  const [selectedInspections, setSelectedInspections] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [generatingMultiplePdf, setGeneratingMultiplePdf] = useState(false);

  const fetchDetails = async () => {
    if (!id || !type) return;
    
    // Verificar autenticação antes de buscar
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      const errorMsg = 'Usuário não autenticado';
      logger.error('Usuário não autenticado ao acessar equipamento', 'auth', { type, id });
      handleError(new Error(errorMsg), 'auth', 'Você precisa estar autenticado para acessar este equipamento.');
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      let equipmentData: EquipmentInfo | null = null;
      let inspectionsData: InspectionInfo[] = [];

      switch (type) {
        case 'extintor': {
          const extData = await getExtinguisherById(id);
          if (extData) {
            // Busca o selo do Inmetro da última inspeção de nível 2 ou 3
            let numeroSeloInmetro: string | undefined = undefined;
            if (user?.id) {
              // Busca última inspeção de nível 2 ou 3 para obter o selo atual
              const { data: lastMaintenance } = await supabase
                .from('inspecoes_extintores' as any)
                .select('numero_selo_inmetro, tipo_servico, data_servico')
                .eq('numero_identificacao', id)
                .eq('user_id', user.id)
                .in('tipo_servico', ['Manutenção Nível 2', 'Manutenção Nível 3'])
                .order('data_servico', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (lastMaintenance && (lastMaintenance as any).numero_selo_inmetro) {
                numeroSeloInmetro = (lastMaintenance as any).numero_selo_inmetro;
              }
            }
            
            equipmentData = {
              ...extData,
              id: extData.numero_identificacao,
              name: extData.numero_identificacao,
              location: undefined,
              numero_selo_inmetro: numeroSeloInmetro, // Selo vem da última manutenção
            };
            
            // Buscar inspeções de extintores da nova tabela
            if (user?.id) {
              const { data: inspections, error: inspError } = await supabase
                .from('inspecoes_extintores' as any)
                .select('*')
                .eq('numero_identificacao', id)
                .eq('user_id', user.id)
                .order('data_servico', { ascending: false })
                .order('created_at', { ascending: false });
              
              if (inspections && !inspError) {
                inspectionsData = inspections.map((insp: any) => ({
                  id: insp.id,
                  data_inspecao: insp.data_servico,
                  tipo_servico: insp.tipo_servico,
                  aprovado: insp.aprovado_inspecao,
                  observacoes: insp.observacoes_gerais,
                  plano_acao: insp.plano_de_acao,
                  link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
                }));
              }
            }
          }
          break;
        }
        case 'chuveiro_lavaolhos': {
          // Usar cache em vez de buscar todos
          const stations = getEquipmentByType('chuveiro_lavaolhos');
          const station = stations.find((e: any) => e.id_equipamento === id);
          if (station) {
            equipmentData = {
              id: station.id_equipamento,
              name: station.id_equipamento,
              location: station.localizacao,
              ...station,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_chuveiros_lava_olhos')
              .select('*')
              .eq('id_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                observacoes_gerais: insp.plano_de_acao || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
              }));
            }
          }
          break;
        }
        case 'camara_espuma': {
          // Usar cache em vez de buscar todos
          const chambers = getEquipmentByType('camara_espuma');
          const chamber = chambers.find((e: any) => e.id_camara === id);
          if (chamber) {
            equipmentData = {
              id: chamber.id_camara,
              name: chamber.id_camara,
              location: chamber.localizacao,
              ...chamber,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_camaras_espuma')
              .select('*')
              .eq('id_camara', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
              }));
            }
          }
          break;
        }
        case 'alarme': {
          // Usar cache em vez de buscar todos
          const systems = getEquipmentByType('alarme');
          const system = systems.find((e: any) => e.id_sistema === id);
          if (system) {
            equipmentData = {
              id: system.id_sistema,
              name: system.id_sistema,
              location: system.localizacao,
              ...system,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_alarmes')
              .select('*')
              .eq('id_sistema', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
              }));
            }
          }
          break;
        }
        case 'canhao_monitor': {
          // Usar cache em vez de buscar todos
          const monitors = getEquipmentByType('canhao_monitor');
          const monitor = monitors.find((e: any) => e.id_equipamento === id);
          if (monitor) {
            equipmentData = {
              id: monitor.id_equipamento,
              name: monitor.id_equipamento,
              location: monitor.localizacao,
              ...monitor,
            };
            const { data, error: inspError } = await supabase
              .from('inspecoes_canhoes_monitores')
              .select('*')
              .eq('id_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && data) {
              inspectionsData = data.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
              }));
            }
          }
          break;
        }
        case 'scba': {
          // Buscar diretamente por ID em vez de buscar todos
          const scba = await getSCBABySerial(id);
          if (scba) {
            equipmentData = {
              ...scba,
              id: String(scba.numero_serie_equipamento),
              name: String(scba.numero_serie_equipamento),
              location: undefined, // conjuntos_autonomos não tem coluna localizacao
            };
            const { data: inspData, error: inspError } = await supabase
              .from('inspecoes_scba')
              .select('*')
              .eq('numero_serie_equipamento', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && inspData) {
              inspectionsData = inspData.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: (insp as any).link_foto_nao_conformidade || undefined,
              }));
            }
          } else {
            logger.warn('SCBA não encontrado', 'equipment', { id });
          }
          break;
        }
        case 'multigas': {
          // Buscar diretamente por ID usando a função específica
          try {
            const detector = await getMultigasDetectorById(id);
            if (detector) {
              equipmentData = {
                ...detector,
                id: String(detector.id_equipamento),
                name: String(detector.id_equipamento),
                location: undefined, // inventario_multigas não tem coluna localizacao
              };
              
              // Buscar inspeções com tratamento de erro
              try {
                const { data: inspData, error: inspError } = await supabase
                  .from('inspecoes_multigas')
                  .select('*')
                  .eq('id_equipamento', id)
                  .order('data_teste', { ascending: false });
                  
                if (inspError) {
                  logger.warn('Erro ao buscar inspeções de multigas', 'equipment', { error: inspError, id });
                } else if (inspData) {
                  inspectionsData = inspData.map(insp => ({
                    id: insp.id || 0,
                    data_inspecao: insp.data_teste || '',
                    status_geral: insp.resultado_teste || undefined,
                    plano_de_acao: insp.plano_de_acao || undefined,
                    link_foto_nao_conformidade: (insp as any).link_foto_nao_conformidade || undefined,
                  }));
                }
              } catch (inspError) {
                logger.error('Erro ao processar inspeções de multigas', 'equipment', { error: inspError, id });
                // Não bloqueia o carregamento do equipamento se houver erro nas inspeções
              }
            } else {
              logger.warn('Multigas não encontrado', 'equipment', { id });
            }
          } catch (permError: any) {
            // Capturar erros de permissão ou outros erros
            const permMsg = permError?.message || String(permError) || `Erro ao acessar equipamento ${id}`;
            logger.error('Erro ao acessar multigas', 'equipment', { error: permError, message: permMsg, id });
            
            // Não chama handleError aqui - deixa o catch principal tratar
            // Apenas loga e continua para tentar busca direta
            logger.warn('Tentando buscar multigas diretamente após erro', 'equipment', { id, error: permMsg });
          }
          
          // Se não encontrou o equipamento, tenta buscar diretamente
          if (!equipmentData) {
            logger.warn('Multigas não encontrado após tentativa com getMultigasDetectorById, tentando busca direta', 'equipment', { id });
            
            try {
              const { data: directData, error: directError } = await supabase
                .from('inventario_multigas')
                .select('*')
                .eq('id_equipamento', id)
                .maybeSingle();
              
              if (directError) {
                logger.error('Erro ao buscar multigas diretamente', 'equipment', { error: directError, id });
              } else if (directData) {
                equipmentData = {
                  ...directData,
                  id: directData.id_equipamento,
                  name: directData.id_equipamento,
                  location: undefined,
                };
              }
            } catch (directError) {
              logger.error('Erro ao tentar busca direta de multigas', 'equipment', { error: directError, id });
            }
          }
          break;
        }
        case 'abrigo': {
          // Usar cache em vez de buscar todos
          const shelters = getEquipmentByType('abrigo');
          const shelter = shelters.find((e: any) => e.id_abrigo === id);
          if (shelter) {
            equipmentData = {
              id: shelter.id_abrigo,
              name: shelter.id_abrigo,
              location: shelter.local, // abrigos tem coluna 'local' não 'localizacao'
              ...shelter,
            };
            const { data: inspData, error: inspError } = await supabase
              .from('inspecoes_abrigos')
              .select('*')
              .eq('id_abrigo', id)
              .order('data_inspecao', { ascending: false });
            if (!inspError && inspData) {
              inspectionsData = inspData.map(insp => ({
                id: insp.id || 0,
                data_inspecao: insp.data_inspecao || '',
                status_geral: insp.status_geral || undefined,
                plano_de_acao: insp.plano_de_acao || undefined,
                link_foto_nao_conformidade: (insp as any).link_foto_nao_conformidade || undefined,
              }));
            }
          } else {
            logger.warn('Abrigo não encontrado', 'equipment', { 
              id, 
              totalAbrigos: shelters.length, 
              idsEncontrados: shelters.map(s => s.id_abrigo) 
            });
          }
          break;
        }
        case 'mangueira': {
          // Buscar diretamente por ID em vez de buscar todos
          const hose = await getHoseById(id);
          if (hose) {
            equipmentData = {
              ...hose,
              id: hose.id_mangueira,
              name: hose.id_mangueira,
              location: (hose as any).localizacao || undefined,
            };
            inspectionsData = [];
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
                  equipmentData = {
                    ...customEq,
                    id: customEq.id_equipamento,
                    name: customEq.id_equipamento,
                    location: customEq.localizacao || undefined,
                  };
                  
                  // Buscar inspeções customizadas
                  if (user?.id) {
                    const { data: inspections, error: inspError } = await supabase
                      .from('custom_equipment_inspections' as any)
                      .select('*')
                      .eq('equipment_type_id', foundType.id)
                      .eq('id_equipamento', id)
                      .eq('user_id', user.id)
                      .order('data_inspecao', { ascending: false });
                    
                    if (!inspError && inspections) {
                      inspectionsData = inspections.map((insp: any) => ({
                        id: insp.id || (typeof insp.id === 'string' ? '' : 0),
                        data_inspecao: insp.data_inspecao || '',
                        status_geral: insp.status_geral || undefined,
                        plano_de_acao: insp.plano_de_acao || undefined,
                        link_foto_nao_conformidade: insp.link_foto_nao_conformidade || undefined,
                      }));
                    }
                  }
                }
              }
            } catch (error) {
              logger.error('Erro ao buscar equipamento customizado', 'equipment', error);
            }
          }
          break;
      }

      if (!equipmentData) {
        handleError(new Error(`Equipamento não encontrado`), 'equipment', `Equipamento não encontrado. Verifique se o ID '${id}' está correto e se você tem permissão para acessá-lo.`);
      } else {
        setEquipment(equipmentData);
        setInspections(inspectionsData);
      }
    } catch (err: any) {
      // Preservar mensagem original do erro ou criar uma descritiva
      let errorMessage = 'Falha ao buscar detalhes do equipamento';
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.code) {
        // Erro do Supabase com código
        if (err.code === 'PGRST116') {
          errorMessage = `Equipamento não encontrado. Verifique se o ID '${id}' está correto.`;
        } else if (err.code === 'PGRST301') {
          errorMessage = `Você não tem permissão para acessar este equipamento.`;
        } else {
          errorMessage = `Erro ao buscar equipamento (código: ${err.code})`;
        }
      }
      
      logger.error('Erro ao buscar detalhes do equipamento', 'equipment', { 
        error: err, 
        errorMessage, 
        type, 
        id,
        errorString: String(err),
        errorType: typeof err
      });
      
      handleError(new Error(errorMessage), 'equipment', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchDetails();
  }, [id, type]);

  const handleDeleteClick = (deleteType: 'equipment' | 'inspection', deleteId: number | string) => {
    haptics.medium(); // Feedback para ação importante (deletar)
    setItemToDelete({ type: deleteType, id: deleteId });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !type) return;
    
    haptics.heavy(); // Feedback pesado para confirmação de ação crítica
    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'equipment') {
        // Determinar qual tabela usar baseado no tipo
        let tableName = '';
        let idColumn = '';
        
        switch (type) {
          case 'extintor':
            tableName = 'extintores';
            idColumn = 'numero_identificacao';
            break;
          case 'chuveiro_lavaolhos':
            tableName = 'inventario_chuveiros_lava_olhos';
            idColumn = 'id_equipamento';
            break;
          case 'camara_espuma':
            tableName = 'inventario_camaras_espuma';
            idColumn = 'id_camara';
            break;
          case 'alarme':
            tableName = 'inventario_alarmes';
            idColumn = 'id_sistema';
            break;
          case 'canhao_monitor':
            tableName = 'inventario_canhoes_monitores';
            idColumn = 'id_equipamento';
            break;
          case 'scba':
            tableName = 'conjuntos_autonomos';
            idColumn = 'numero_serie_equipamento';
            break;
          case 'multigas':
            tableName = 'inventario_multigas';
            idColumn = 'id_equipamento';
            break;
          case 'abrigo':
            tableName = 'abrigos';
            idColumn = 'id_abrigo';
            break;
          case 'mangueira':
            tableName = 'mangueiras';
            idColumn = 'id_mangueira';
            break;
        }

        if (tableName && idColumn) {
          // Deleta usando o campo correto (não é sempre 'id')
          // Para suportar offline, primeiro tenta deletar online
          try {
            // Verifica se o registro existe antes de deletar (para debug)
            const { data: existing, error: checkError } = await supabase
              .from(tableName as any)
              .select(idColumn)
              .eq(idColumn, itemToDelete.id)
              .eq('user_id', user?.id || '')
              .limit(1)
              .maybeSingle();
            
            if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
            }
            
            if (!existing) {
              logger.warn('Registro não encontrado para exclusão', 'equipment', {
                table: tableName,
                idColumn,
                id: itemToDelete.id
              });
              // Continua mesmo assim para atualizar o cache
            } else {
              // Deleta o registro
              const { data: deleted, error: deleteError } = await supabase
                .from(tableName as any)
                .delete()
                .eq(idColumn, itemToDelete.id)
                .eq('user_id', user?.id || '')
                .select();
              
              if (deleteError) throw deleteError;
              
              // Verifica se realmente deletou algo
              if (!deleted || deleted.length === 0) {
                logger.warn('Nenhum registro foi deletado', 'equipment', {
                  table: tableName,
                  idColumn,
                  id: itemToDelete.id
                });
              } else {
                logger.info('Registro deletado com sucesso', 'equipment', {
                  table: tableName,
                  idColumn,
                  id: itemToDelete.id,
                  deletedCount: deleted.length
                });
              }
            }
          } catch (error: any) {
            // Se falhar por erro de rede, salva como operação offline
            const isNetworkError = 
              error?.message?.includes('fetch') ||
              error?.message?.includes('network') ||
              error?.message?.includes('timeout') ||
              error?.message?.includes('Failed to fetch');
            
            if (isNetworkError) {
              // Salva como operação pendente para sincronizar depois
              const { savePendingOperation } = await import('../utils/offlineDB');
              await savePendingOperation('delete', tableName, {
                [idColumn]: itemToDelete.id,
                user_id: user?.id
              });
              logger.info('Exclusão salva offline para sincronização posterior', 'equipment');
            } else {
              throw error;
            }
          }
          
          // SEMPRE atualiza o cache, mesmo se a exclusão falhou silenciosamente
          // Isso garante que a lista seja atualizada
          try {
            logger.info('Atualizando cache após exclusão', 'equipment', { type, tableName, id: itemToDelete.id });
            
            // Aguarda um pouco mais para garantir que o banco processou a exclusão
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Força atualização seletiva do cache (só o tipo modificado)
            if (type?.startsWith('custom-')) {
              await refreshCache();
            } else {
              await refreshTypes([type as EquipmentTypeKey]);
            }
            
            // Aguarda mais um pouco para garantir que o cache foi completamente atualizado
            await new Promise(resolve => setTimeout(resolve, 300));
            
            logger.info('Cache atualizado com sucesso após exclusão', 'equipment', { type, tableName });
          } catch (error) {
            logger.error('Erro ao atualizar cache após exclusão', 'equipment', error);
            // Continua mesmo se o cache falhar
          }
          
          navigate(`/inspections/${type}`);
        }
      } else {
        // Deletar inspeção baseado no tipo
        let tableName = '';
        
        // Verifica se é equipamento customizado
        if (type.startsWith('custom-')) {
          tableName = 'custom_equipment_inspections';
        } else {
          switch (type) {
            case 'extintor':
              tableName = 'inspecoes_extintores';
              break;
            case 'chuveiro_lavaolhos':
              tableName = 'inspecoes_chuveiros_lava_olhos';
              break;
            case 'camara_espuma':
              tableName = 'inspecoes_camaras_espuma';
              break;
            case 'alarme':
              tableName = 'inspecoes_alarmes';
              break;
            case 'canhao_monitor':
              tableName = 'inspecoes_canhoes_monitores';
              break;
            case 'scba':
              tableName = 'inspecoes_scba';
              break;
            case 'multigas':
              tableName = 'inspecoes_multigas';
              break;
            case 'abrigo':
              tableName = 'inspecoes_abrigos';
              break;
            case 'mangueira':
              tableName = 'inspecoes_mangueiras';
              break;
          }
        }

        if (tableName) {
          // Usa wrapper offline para suportar modo offline
          const { offlineDelete } = await import('../utils/offlineOperations');
          const result = await offlineDelete(tableName, itemToDelete.id, user?.id);
          
          if (!result.success) {
            throw new Error('Falha ao excluir inspeção');
          }
          
          // Atualiza o cache seletivamente (só o tipo modificado)
          try {
            if (type?.startsWith('custom-')) {
              await refreshCache();
            } else {
              await refreshTypes([type as EquipmentTypeKey]);
            }
          } catch (error) {
            logger.error('Erro ao atualizar cache após exclusão de inspeção', 'equipment', error);
          }
          
          // Remove do estado local
          setInspections(inspections.filter(insp => insp.id !== itemToDelete.id));
          
          showSuccess(t('inspection.deleteSuccess', { defaultValue: 'Inspeção excluída com sucesso' }));
        } else {
          throw new Error(`Tipo de equipamento não suportado para exclusão de inspeção: ${type}`);
        }
      }
    } catch (err) {
      handleError(err, 'equipment', 'Falha ao excluir o item. Tente novamente.');
      logger.error('Erro ao excluir item', 'equipment', { error: err, itemToDelete });
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return 'bg-gray-200 dark:bg-gray-700';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aprovado') || statusLower === 'ok') return 'bg-status-success/20 text-status-success';
    if (statusLower.includes('reprovado') || statusLower.includes('nao conforme')) return 'bg-status-error/20 text-status-error';
    if (statusLower.includes('pendente')) return 'bg-status-warning/20 text-status-warning';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  const getInspectionTableName = (): string => {
    switch (type) {
      case 'extintor':
        return 'inspecoes_extintores';
      case 'chuveiro_lavaolhos':
        return 'inspecoes_chuveiros_lava_olhos';
      case 'camara_espuma':
        return 'inspecoes_camaras_espuma';
      case 'alarme':
        return 'inspecoes_alarmes';
      case 'canhao_monitor':
        return 'inspecoes_canhoes_monitores';
      case 'scba':
        return 'inspecoes_scba';
      case 'multigas':
        return 'inspecoes_multigas';
      case 'abrigo':
        return 'inspecoes_abrigos';
      case 'mangueira':
        return 'inspecoes_mangueiras';
      default:
        return '';
    }
  };

  const fetchInspectionData = async (inspectionId: number): Promise<any> => {
    const tableName = getInspectionTableName();
    if (!tableName || !user) return null;

    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  };

  const handleGenerateReport = async (inspectionId: number) => {
    if (!equipment || !type || !user) return;
    
    setGeneratingPdf(inspectionId);
    
    try {
      // Buscar dados da inspeção
      logger.debug('Buscando dados da inspeção para PDF', 'equipment', { inspectionId, type });
      const inspectionData = await fetchInspectionData(inspectionId);
      if (!inspectionData) {
        throw new Error('Inspeção não encontrada');
      }

      // Buscar perfil do usuário para nome do responsável
      logger.debug('Buscando perfil do usuário', 'equipment', { userId: user.id });
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Preparar dados para o relatório
      logger.debug('Preparando dados do relatório', 'equipment', { equipmentId: equipment.id, inspectionId });
      const reportData = {
        equipment: {
          ...equipment,
          id: equipment.id,
          name: equipment.name,
          type: type,
          location: equipment.location,
        } as EquipmentData,
        inspection: mapInspectionForPdf(inspectionData, type),
        companyName: undefined,
        responsibleName: profile?.full_name || inspectionData.inspetor || inspectionData.inspetor_responsavel,
      };

      // Gerar PDF
      logger.debug('Gerando PDF', 'equipment', { equipmentId: equipment.id, inspectionId });
      const pdfBlob = await generateInspectionReport(reportData);
      logger.debug('PDF gerado com sucesso', 'equipment', { blobSize: pdfBlob.size });

      // Salvar/compartilhar PDF
      let dateStr: string;
      try {
        const inspectionDate = inspectionData.data_inspecao || inspectionData.data_servico || inspectionData.data_teste || new Date().toISOString();
        dateStr = format(parseInspectionDate(inspectionDate), 'yyyy-MM-dd');
      } catch (dateError) {
        logger.warn('Erro ao formatar data para nome do arquivo, usando data atual', 'equipment', { dateError });
        dateStr = format(new Date(), 'yyyy-MM-dd');
      }
      
      const filename = `Relatorio_Inspecao_${equipment.name}_${dateStr}.pdf`;
      logger.debug('Salvando PDF no dispositivo', 'equipment', { filename, blobSize: pdfBlob.size });
      await savePdfToDevice(pdfBlob, filename);
      logger.info('PDF salvo com sucesso', 'equipment', { filename });

      // Mostrar mensagem de sucesso
      showSuccess('Relatório gerado com sucesso!');
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Erro desconhecido ao gerar relatório';
      logger.error('Erro ao gerar relatório PDF', 'equipment', { 
        error: errorMessage, 
        errorDetails: error,
        inspectionId,
        equipmentType: type,
        equipmentId: equipment?.id 
      });
      handleError(new Error(errorMessage), 'equipment', `Erro ao gerar relatório: ${errorMessage}`);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleToggleInspection = (inspectionId: number) => {
    const newSelected = new Set(selectedInspections);
    if (newSelected.has(inspectionId)) {
      newSelected.delete(inspectionId);
    } else {
      newSelected.add(inspectionId);
    }
    setSelectedInspections(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInspections.size === inspections.length) {
      setSelectedInspections(new Set());
    } else {
      setSelectedInspections(new Set(inspections.map(insp => insp.id)));
    }
  };

  const handleGenerateMultipleReport = async () => {
    if (!equipment || !type || !user || selectedInspections.size === 0) return;

    setGeneratingMultiplePdf(true);

    try {
      // Buscar dados completos das inspeções selecionadas
      const inspectionDataList: InspectionData[] = [];
      
      for (const inspectionId of selectedInspections) {
        const inspectionData = await fetchInspectionData(inspectionId);
        if (inspectionData) {
          inspectionDataList.push(mapInspectionForPdf(inspectionData, type));
        }
      }

      if (inspectionDataList.length === 0) {
        throw new Error('Nenhuma inspeção válida selecionada');
      }

      // Ordenar por data
      inspectionDataList.sort((a, b) => {
        const dateA = parseInspectionDate(a.data_inspecao).getTime();
        const dateB = parseInspectionDate(b.data_inspecao).getTime();
        return dateA - dateB;
      });

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Preparar dados para o relatório
      const reportData = {
        equipment: {
          ...equipment,
          id: equipment.id,
          name: equipment.name,
          type: type,
          location: equipment.location,
        } as EquipmentData,
        inspections: inspectionDataList,
        companyName: undefined,
        responsibleName: profile?.full_name || undefined,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
      };

      // Gerar PDF
      const pdfBlob = await generateMultipleInspectionReport(reportData);

      // Salvar/compartilhar PDF
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `Relatorio_Multiplas_Inspecoes_${equipment.name}_${dateStr}.pdf`;
      await savePdfToDevice(pdfBlob, filename);

      // Fechar modal e limpar seleção
      setShowMultipleReportModal(false);
      setSelectedInspections(new Set());
      setDateRange({ start: '', end: '' });

      // Mostrar mensagem de sucesso
      showSuccess('Relatório de múltiplas inspeções gerado com sucesso!');
    } catch (error) {

      logger.error('Erro ao gerar relatório de múltiplas inspeções', 'equipment', { error });
      handleError(error, 'equipment', 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGeneratingMultiplePdf(false);
    }
  };

  const modalTitle = itemToDelete?.type === 'equipment' ? t('equipment.delete') : t('inspection.delete', { defaultValue: 'Excluir Inspeção' });
  const modalMessage = t('common.deleteConfirm', { defaultValue: 'Você tem certeza que deseja excluir este item? Esta ação é irreversível e todos os dados associados serão perdidos.' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={loading ? '' : equipment?.name ?? t('equipment.details')}>
        {!loading && equipment && (
          <div className="flex items-center gap-2">
            <Link to={`/equipment/${type}/${id}/edit`} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-white transition-colors">
              <Edit size={20} />
            </Link>
            <button onClick={() => id && handleDeleteClick('equipment', id)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </PageHeader>
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        {loading && <DetailSkeleton />}
        {!loading && equipment && (
          <>
            <div className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border mb-4" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <h2 className="font-bold text-base mb-3">{t('equipment.details')}</h2>
              
              {/* Informações básicas comuns */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-400">ID:</span>
                  <span className="text-white text-right">{equipment.name}</span>
                </div>
                {equipment.location && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-400">{t('equipment.location')}:</span>
                    <span className="text-white text-right">{equipment.location}</span>
                  </div>
                )}
              </div>

              {/* Informações específicas por tipo de equipamento */}
              {type === 'extintor' && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                  {equipment.tipo_agente && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Tipo de Agente:</span>
                      <span className="text-white text-right">{equipment.tipo_agente}</span>
                    </div>
                  )}
                  {equipment.capacidade && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Capacidade:</span>
                      <span className="text-white text-right">{equipment.capacidade}L</span>
                    </div>
                  )}
                  {equipment.marca_fabricante && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Marca:</span>
                      <span className="text-white text-right">{equipment.marca_fabricante}</span>
                    </div>
                  )}
                  {equipment.ano_fabricacao && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Ano de Fabricação:</span>
                      <span className="text-white text-right">{equipment.ano_fabricacao}</span>
                    </div>
                  )}
                  {equipment.numero_selo_inmetro && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Nº Selo Inmetro:</span>
                      <span className="text-white text-right">{equipment.numero_selo_inmetro}</span>
                    </div>
                  )}
                  {equipment.tipo_servico && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Tipo de Serviço:</span>
                      <span className="text-white text-right">{equipment.tipo_servico}</span>
                    </div>
                  )}
                  {equipment.data_servico && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Data do Serviço:</span>
                      <span className="text-white text-right">{format(parseInspectionDate(equipment.data_servico), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                  {equipment.data_proxima_inspecao && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Próxima Inspeção:</span>
                      <span className="text-white text-right">{format(new Date(equipment.data_proxima_inspecao), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                  {equipment.aprovado_inspecao && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Status:</span>
                      <span className={`text-right px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(equipment.aprovado_inspecao)}`}>
                        {equipment.aprovado_inspecao}
                      </span>
                    </div>
                  )}
                  {equipment.inspetor_responsavel && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Inspetor:</span>
                      <span className="text-white text-right text-xs">{equipment.inspetor_responsavel}</span>
                    </div>
                  )}
                  {/* Pesagem CO₂ — exibido apenas quando o cadastro tem PC e o agente é CO2 */}
                  {equipment.tipo_agente === 'CO2' && (equipment as any).peso_cheio_placa_kg != null && (
                    <div className="mt-2 pt-2 border-t space-y-2" style={{ borderColor: '#3A3A3A' }}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesagem CO₂</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-400">Peso Cheio (placa):</span>
                        <span className="text-white text-right">{(equipment as any).peso_cheio_placa_kg} kg</span>
                      </div>
                      {(equipment as any).peso_vazio_conjunto_kg != null && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-400">Peso Vazio (conjunto):</span>
                          <span className="text-white text-right">{(equipment as any).peso_vazio_conjunto_kg} kg</span>
                        </div>
                      )}
                      {(equipment as any).data_proxima_pesagem_co2 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-400">Próxima Pesagem:</span>
                          <span className="text-white text-right">
                            {format(new Date((equipment as any).data_proxima_pesagem_co2), 'dd/MM/yyyy', { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {type === 'scba' && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                  {equipment.marca && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Marca:</span>
                      <span className="text-white text-right">{equipment.marca}</span>
                    </div>
                  )}
                  {equipment.modelo && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Modelo:</span>
                      <span className="text-white text-right">{equipment.modelo}</span>
                    </div>
                  )}
                  {equipment.numero_serie_mascara && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Nº Série (Máscara):</span>
                      <span className="text-white text-right">{equipment.numero_serie_mascara}</span>
                    </div>
                  )}
                  {equipment.numero_serie_segundo_estagio && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Nº Série (Segundo Estágio):</span>
                      <span className="text-white text-right">{equipment.numero_serie_segundo_estagio}</span>
                    </div>
                  )}
                  {equipment.data_teste && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Data do Teste:</span>
                      <span className="text-white text-right">{format(parseInspectionDate(equipment.data_teste), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                  {equipment.data_validade && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Data de Validade:</span>
                      <span className="text-white text-right">{format(new Date(equipment.data_validade), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                  {equipment.resultado_final && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Resultado:</span>
                      <span className={`text-right px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(equipment.resultado_final)}`}>
                        {equipment.resultado_final}
                      </span>
                    </div>
                  )}
                  {equipment.inspetor_responsavel && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Inspetor:</span>
                      <span className="text-white text-right text-xs">{equipment.inspetor_responsavel}</span>
                    </div>
                  )}
                </div>
              )}

              {type === 'multigas' && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                  {equipment.marca && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Marca:</span>
                      <span className="text-white text-right">{equipment.marca}</span>
                    </div>
                  )}
                  {equipment.modelo && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Modelo:</span>
                      <span className="text-white text-right">{equipment.modelo}</span>
                    </div>
                  )}
                  {equipment.numero_serie && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Nº de Série:</span>
                      <span className="text-white text-right">{equipment.numero_serie}</span>
                    </div>
                  )}
                  {equipment.data_cadastro && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Data de Cadastro:</span>
                      <span className="text-white text-right">{format(new Date(equipment.data_cadastro), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                  {(equipment.lel_cilindro !== null && equipment.lel_cilindro !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">LEL Cilindro:</span>
                      <span className="text-white text-right">{equipment.lel_cilindro}%</span>
                    </div>
                  )}
                  {(equipment.o2_cilindro !== null && equipment.o2_cilindro !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">O2 Cilindro:</span>
                      <span className="text-white text-right">{equipment.o2_cilindro}%</span>
                    </div>
                  )}
                  {(equipment.h2s_cilindro !== null && equipment.h2s_cilindro !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">H2S Cilindro:</span>
                      <span className="text-white text-right">{equipment.h2s_cilindro}ppm</span>
                    </div>
                  )}
                  {(equipment.co_cilindro !== null && equipment.co_cilindro !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">CO Cilindro:</span>
                      <span className="text-white text-right">{equipment.co_cilindro}ppm</span>
                    </div>
                  )}
                  {/* Margens por vapor (novas) */}
                  {(['lel', 'o2', 'h2s', 'co'] as const).some(g => (equipment as any)[`margem_erro_${g}`] != null) ? (
                    <>
                      {(['lel', 'o2', 'h2s', 'co'] as const).map(gas => {
                        const val = (equipment as any)[`margem_erro_${gas}`];
                        if (val == null) return null;
                        return (
                          <div key={gas} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-400">Margem {gas.toUpperCase()}:</span>
                            <span className="text-white text-right">{val}%</span>
                          </div>
                        );
                      })}
                    </>
                  ) : (equipment.margem_erro_cilindro !== null && equipment.margem_erro_cilindro !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Margem de Erro:</span>
                      <span className="text-white text-right">{equipment.margem_erro_cilindro}%</span>
                    </div>
                  )}
                </div>
              )}

              {type === 'mangueira' && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                  {equipment.diametro && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Diâmetro:</span>
                      <span className="text-white text-right">{equipment.diametro}mm</span>
                    </div>
                  )}
                  {equipment.comprimento && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Comprimento:</span>
                      <span className="text-white text-right">{equipment.comprimento}m</span>
                    </div>
                  )}
                  {equipment.tipo_mangueira && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Tipo:</span>
                      <span className="text-white text-right">{equipment.tipo_mangueira}</span>
                    </div>
                  )}
                  {equipment.pressao_trabalho && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Pressão de Trabalho:</span>
                      <span className="text-white text-right">{equipment.pressao_trabalho}bar</span>
                    </div>
                  )}
                </div>
              )}

              {(type === 'chuveiro_lavaolhos' || type === 'camara_espuma' || type === 'alarme' || type === 'canhao_monitor' || type === 'abrigo') && (
                <div className="space-y-2 pt-3 border-t" style={{ borderColor: '#2A2A2A' }}>
                  {type === 'camara_espuma' && equipment.tipo_camara && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Tipo de Câmara:</span>
                      <span className="text-white text-right">{equipment.tipo_camara}</span>
                    </div>
                  )}
                  {type === 'camara_espuma' && equipment.numero_mcs && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Número MCS:</span>
                      <span className="text-white text-right">MCS {equipment.numero_mcs}</span>
                    </div>
                  )}
                  {equipment.marca && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Marca:</span>
                      <span className="text-white text-right">{equipment.marca}</span>
                    </div>
                  )}
                  {equipment.modelo && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Modelo:</span>
                      <span className="text-white text-right">{equipment.modelo}</span>
                    </div>
                  )}
                  {equipment.numero_serie && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Nº de Série:</span>
                      <span className="text-white text-right">{equipment.numero_serie}</span>
                    </div>
                  )}
                  {equipment.data_cadastro && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-400">Data de Cadastro:</span>
                      <span className="text-white text-right">{format(new Date(equipment.data_cadastro), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observações gerais se existirem */}
              {equipment.observacoes_gerais && (
                <div className="pt-3 border-t mt-3" style={{ borderColor: '#2A2A2A' }}>
                  <span className="font-semibold text-gray-400 block mb-1 text-sm">Observações:</span>
                  <p className="text-white text-xs leading-relaxed">{equipment.observacoes_gerais}</p>
                </div>
              )}
            </div>

            <div className="mb-6 flex gap-2">
              <Link
                to={`/equipment/${type}/${id}/inspections/new`}
                className="flex-1 text-center block p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('inspection.add')}
              </Link>
              {inspections.length > 0 && (
                <button
                  onClick={() => setShowMultipleReportModal(true)}
                  className="px-4 p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  title="Gerar relatório de múltiplas inspeções"
                >
                  <FileText size={20} />
                </button>
              )}
            </div>

            <div>
              <h2 className="font-bold text-lg mb-2">{t('inspection.history')}</h2>
              {inspections.length > 0 ? (
                <ul className="space-y-3">
                  {inspections.map(insp => (
                    <li key={insp.id} className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border flex justify-between items-start gap-4" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{format(parseInspectionDate(insp.data_inspecao), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                              {format(parseInspectionDate(insp.data_inspecao), "HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                            </p>
                          </div>
                          {insp.status_geral && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.status_geral)}`}>
                              {insp.status_geral}
                            </span>
                          )}
                        </div>
                        {insp.plano_de_acao && (
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                            {insp.plano_de_acao}
                          </p>
                        )}
                        {insp.link_foto_nao_conformidade && (
                          <div className="mt-2">
                            <ProgressiveImage
                              src={insp.link_foto_nao_conformidade}
                              alt="Foto de evidência"
                              className="w-full h-32 object-cover rounded-lg cursor-pointer"
                              onClick={() => insp.link_foto_nao_conformidade && window.open(insp.link_foto_nao_conformidade, '_blank')}
                            />
                            {insp.link_foto_nao_conformidade && (
                              <a href={insp.link_foto_nao_conformidade} target="_blank" rel="noopener noreferrer" className="text-xs text-white mt-1 block">
                                {t('common.viewFullPhoto', { defaultValue: 'Ver foto completa' })}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleGenerateReport(insp.id || 0)} 
                          disabled={generatingPdf === (insp.id || 0)}
                          className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-400 transition-colors disabled:opacity-50"
                          title="Gerar relatório PDF"
                        >
                          {generatingPdf === insp.id ? (
                            <IconSkeleton className="h-4 w-4" />
                          ) : (
                            <FileText size={16} />
                          )}
                        </button>
                        <button onClick={() => handleDeleteClick('inspection', insp.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-4">{t('inspection.noInspections')}</p>
              )}
            </div>
          </>
        )}
      </main>
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={modalTitle}
        message={modalMessage}
        isLoading={isDeleting}
      />

      {/* Modal para seleção de múltiplas inspeções */}
      {showMultipleReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="p-4 border-b" style={{ borderColor: '#2A2A2A' }}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Gerar Relatório de Múltiplas Inspeções</h3>
                <button
                  onClick={() => {
                    setShowMultipleReportModal(false);
                    setSelectedInspections(new Set());
                    setDateRange({ start: '', end: '' });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Intervalo de datas (opcional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Intervalo de Datas (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="flex-1 px-3 py-2 bg-black border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
                    style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="flex-1 px-3 py-2 bg-black border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none text-white"
                    style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}
                  />
                </div>
              </div>

              {/* Seleção de inspeções */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-400">Selecionar Inspeções</label>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {selectedInspections.size === inspections.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inspections.map(insp => (
                    <label
                      key={insp.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInspections.has(insp.id)}
                        onChange={() => handleToggleInspection(insp.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white text-sm font-medium">
                              {format(parseInspectionDate(insp.data_inspecao), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                            </span>
                            <span className="text-xs text-gray-400 block mt-0.5">
                              {format(parseInspectionDate(insp.data_inspecao), "HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                            </span>
                          </div>
                          {insp.status_geral && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.status_geral)}`}>
                              {insp.status_geral}
                            </span>
                          )}
                        </div>
                        {insp.plano_de_acao && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{insp.plano_de_acao}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedInspections.size} de {inspections.length} inspeções selecionadas
                </p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: '#2A2A2A' }}>
              <button
                onClick={() => {
                  setShowMultipleReportModal(false);
                  setSelectedInspections(new Set());
                  setDateRange({ start: '', end: '' });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={generatingMultiplePdf}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateMultipleReport}
                disabled={selectedInspections.size === 0 || generatingMultiplePdf}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingMultiplePdf ? (
                  <>
                    <IconSkeleton className="h-4 w-4" />
                    <ButtonSkeleton width="w-16" />
                  </>
                ) : (
                  'Gerar Relatório'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentDetailPage;
