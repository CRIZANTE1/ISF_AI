import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import { Spinner } from '../components/ui/spinner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ProgressiveImage from '../components/ProgressiveImage';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Trash2, Edit, FileText } from 'lucide-react';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';
import { getExtinguisherById, getLastExtinguisherInspection } from '../utils/extinguisherOperations';
import { getHoseById } from '../utils/hoseOperations';
import { getSCBABySerial } from '../utils/scbaOperations';
import { getMultigasDetectorById } from '../utils/multigasOperations';
import { generateInspectionReport, savePdfToDevice, type InspectionData, type EquipmentData } from '../utils/pdfReportGenerator';

type EquipmentInfo = {
  id: string;
  name: string;
  location?: string;
  [key: string]: any;
};

type InspectionInfo = {
  id: number;
  data_inspecao: string;
  status_geral?: string;
  status?: string;
  notes?: string;
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_foto_nao_conformidade?: string;
};

const EquipmentDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEquipmentByType } = useEquipmentCache();
  const { handleError } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [inspections, setInspections] = useState<InspectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // State for deletion modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'inspection'; id: number | string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for PDF generation
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);

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
              
              if (lastMaintenance?.numero_selo_inmetro) {
                numeroSeloInmetro = lastMaintenance.numero_selo_inmetro;
              }
            }
            
            equipmentData = {
              id: extData.numero_identificacao,
              name: extData.numero_identificacao,
              location: extData.local_id || undefined,
              numero_selo_inmetro: numeroSeloInmetro, // Selo vem da última manutenção
              ...extData,
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
                  link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
                status_geral: insp.status_geral,
                observacoes_gerais: insp.plano_de_acao,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
              id: scba.numero_serie_equipamento,
              name: scba.numero_serie_equipamento,
              location: undefined, // conjuntos_autonomos não tem coluna localizacao
              ...scba,
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
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
                id: detector.id_equipamento,
                name: detector.id_equipamento,
                location: undefined, // inventario_multigas não tem coluna localizacao
                ...detector,
              };
              const { data: inspData, error: inspError } = await supabase
                .from('inspecoes_multigas')
                .select('*')
                .eq('id_equipamento', id)
                .order('data_teste', { ascending: false });
              if (!inspError && inspData) {
                inspectionsData = inspData.map(insp => ({
                  id: insp.id || 0,
                  data_inspecao: insp.data_teste || '',
                  status_geral: insp.resultado_teste || '',
                  plano_de_acao: insp.plano_de_acao,
                  link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
                }));
              }
            } else {
              const errorMsg = `Multigas não encontrado: ${id}`;
              logger.warn('Multigas não encontrado', 'equipment', { id });
            }
          } catch (permError: any) {
            // Capturar erros de permissão
            const permMsg = permError?.message || `Erro ao acessar ${id}: ${permError}`;
            logger.error('Erro ao acessar multigas', 'equipment', { error: permError, id });
            if (!equipmentData) {
              handleError(new Error(permMsg), 'permission');
            }
          }
          
          if (!equipmentData) {
            const errorMsg = `Multigas não encontrado: ${id}`;
            logger.warn('Multigas não encontrado após tentativas', 'equipment', { id });
            
            // Fallback: tentar buscar do cache
            const allDetectors = getEquipmentByType('multigas');
            
            // Tentar buscar diretamente via Supabase sem usar a função wrapper
            const { data: directData, error: directError } = await supabase
              .from('inventario_multigas')
              .select('*')
              .eq('id_equipamento', id)
              .maybeSingle();
            
            if (directData) {
              equipmentData = {
                id: directData.id_equipamento,
                name: directData.id_equipamento,
                location: undefined,
                ...directData,
              };
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
                status_geral: insp.status_geral,
                plano_de_acao: insp.plano_de_acao,
                link_foto_nao_conformidade: insp.link_foto_nao_conformidade,
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
              id: hose.id_mangueira,
              name: hose.id_mangueira,
              location: hose.localizacao,
              ...hose,
            };
            inspectionsData = [];
          }
          break;
        }
      }

      if (!equipmentData) {
        handleError(new Error(`Equipamento não encontrado`), 'equipment', `Equipamento não encontrado. Verifique se o ID '${id}' está correto e se você tem permissão para acessá-lo.`);
      } else {
        setEquipment(equipmentData);
        setInspections(inspectionsData);
      }
    } catch (err: any) {
      const errorMsg = `Falha ao buscar detalhes do equipamento: ${err?.message || JSON.stringify(err)}`;
      handleError(err, 'equipment', 'Falha ao buscar detalhes do equipamento');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchDetails();
  }, [id, type]);

  const handleDeleteClick = (deleteType: 'equipment' | 'inspection', deleteId: number | string) => {
    setItemToDelete({ type: deleteType, id: deleteId });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !type) return;
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
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq(idColumn, itemToDelete.id);
          if (error) throw error;
          navigate(`/inspections/${type}`);
        }
      } else {
        // Deletar inspeção baseado no tipo
        let tableName = '';
        
        switch (type) {
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
        }

        if (tableName) {
          const { error } = await supabase
            .from(tableName as any)
            .delete()
            .eq('id', itemToDelete.id);
          if (error) throw error;
          setInspections(inspections.filter(insp => insp.id !== itemToDelete.id));
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

  const handleGenerateReport = async (inspectionId: number) => {
    if (!equipment || !type || !user) return;
    
    setGeneratingPdf(inspectionId);
    
    try {
      // Buscar dados completos da inspeção
      let inspectionData: any = null;
      let tableName = '';

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

      if (tableName) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('id', inspectionId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        inspectionData = data;
      }

      if (!inspectionData) {
        throw new Error('Inspeção não encontrada');
      }

      // Buscar perfil do usuário para nome do responsável
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Preparar dados para o relatório
      const reportData = {
        equipment: {
          id: equipment.id,
          name: equipment.name,
          type: type,
          location: equipment.location,
          ...equipment,
        } as EquipmentData,
        inspection: {
          id: inspectionData.id,
          data_inspecao: inspectionData.data_inspecao || inspectionData.data_servico || inspectionData.data_teste || '',
          status_geral: inspectionData.status_geral,
          tipo_servico: inspectionData.tipo_servico,
          tipo_inspecao: inspectionData.tipo_inspecao,
          inspetor: inspectionData.inspetor || inspectionData.inspetor_responsavel,
          observacoes_gerais: inspectionData.observacoes_gerais,
          plano_de_acao: inspectionData.plano_de_acao,
          link_foto_nao_conformidade: inspectionData.link_foto_nao_conformidade,
          resultados_json: inspectionData.resultados_json,
          latitude: inspectionData.latitude,
          longitude: inspectionData.longitude,
          data_proxima_inspecao: inspectionData.data_proxima_inspecao,
        } as InspectionData,
        companyName: undefined, // Pode ser adicionado depois
        responsibleName: profile?.full_name || inspectionData.inspetor || inspectionData.inspetor_responsavel,
      };

      // Gerar PDF
      const pdfBlob = await generateInspectionReport(reportData);

      // Salvar/compartilhar PDF
      const dateStr = format(new Date(inspectionData.data_inspecao || inspectionData.data_servico || new Date()), 'yyyy-MM-dd');
      const filename = `Relatorio_Inspecao_${equipment.name}_${dateStr}.pdf`;
      await savePdfToDevice(pdfBlob, filename);

      // Mostrar mensagem de sucesso
      handleError(null, 'success', 'Relatório gerado com sucesso!');
    } catch (error) {
      logger.error('Erro ao gerar relatório PDF', 'pdf', { error, inspectionId });
      handleError(error, 'pdf', 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGeneratingPdf(null);
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
            <button onClick={() => handleDeleteClick('equipment', id)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </PageHeader>
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" color="blue" />
          </div>
        )}
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
                      <span className="text-white text-right">{format(new Date(equipment.data_servico), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
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
                      <span className="text-white text-right">{format(new Date(equipment.data_teste), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
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
                  {(equipment.margem_erro_cilindro !== null && equipment.margem_erro_cilindro !== undefined) && (
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

            <div className="mb-6">
              <Link
                to={`/equipment/${type}/${id}/inspections/new`}
                className="w-full text-center block p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('inspection.add')}
              </Link>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-2">{t('inspection.history')}</h2>
              {inspections.length > 0 ? (
                <ul className="space-y-3">
                  {inspections.map(insp => (
                    <li key={insp.id} className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border flex justify-between items-start gap-4" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold">{format(new Date(insp.data_inspecao), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</p>
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
                              onClick={() => window.open(insp.link_foto_nao_conformidade, '_blank')}
                            />
                            <a href={insp.link_foto_nao_conformidade} target="_blank" rel="noopener noreferrer" className="text-xs text-white mt-1 block">
                              {t('common.viewFullPhoto', { defaultValue: 'Ver foto completa' })}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleGenerateReport(insp.id)} 
                          disabled={generatingPdf === insp.id}
                          className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-blue-400 transition-colors disabled:opacity-50"
                          title="Gerar relatório PDF"
                        >
                          {generatingPdf === insp.id ? (
                            <Spinner size="sm" color="blue" />
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
    </div>
  );
};

export default EquipmentDetailPage;
