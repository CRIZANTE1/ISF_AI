import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, AlertCircle, Filter, Check, X, Eye, FileText, Trash2 } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui/spinner';
import LoadingScreen from '../components/LoadingScreen';
import { logger } from '../utils/logger';
import { getActionPlanStatus, classifyActionPlanPriority, getActionPlanStatusMessage, type ActionPlanPriority } from '../utils/actionPlanUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../contexts/ToastContext';
import FileUpload from '../components/FileUpload';
import { uploadEvidencePhoto, uploadFile } from '../utils/storage';

const ACTION_PLAN_MODAL_STATE = 'actionPlanResolutionState';

interface ActionPlan {
  id: string | number;
  type: string;
  equipmentType: string;
  equipmentId: string;
  date: string;
  status: string;
  actionPlan: string;
  inspector?: string;
  photoUrl?: string;
  inspectionId: string;
  tableName: string;
  statusGeral?: string;
  priority?: ActionPlanPriority;
  planStatus?: ReturnType<typeof getActionPlanStatus>;
}

type FilterType = 'all' | 'pending' | 'resolved';

const ActionPlansPage = () => {
  const { user } = useAuth();
  const { refreshCache } = useEquipmentCache();
  const { handleError } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveEvidenceFile, setResolveEvidenceFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | number | null>(null);
  const [planToDelete, setPlanToDelete] = useState<ActionPlan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Efeito para salvar o estado do modal no sessionStorage quando o app for para o background
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && isResolveModalOpen && selectedPlan) {
          const stateToSave = {
            inspectionId: selectedPlan.inspectionId,
            tableName: selectedPlan.tableName,
          };
          sessionStorage.setItem(ACTION_PLAN_MODAL_STATE, JSON.stringify(stateToSave));
          logger.info('Estado do modal de plano de ação salvo.', 'action-plans', stateToSave);
        }
      });
      return () => { listener.remove(); };
    }
  }, [isResolveModalOpen, selectedPlan]);

  // Efeito para restaurar o estado do modal quando a página carregar (e os planos de ação estiverem disponíveis)
  useEffect(() => {
    if (actionPlans.length > 0) {
      const savedStateJSON = sessionStorage.getItem(ACTION_PLAN_MODAL_STATE);
      if (savedStateJSON) {
        try {
          const savedState = JSON.parse(savedStateJSON);
          const planToRestore = actionPlans.find(
            p => p.inspectionId === savedState.inspectionId && p.tableName === savedState.tableName
          );

          if (planToRestore) {
            logger.info('Restaurando estado do modal de plano de ação.', 'action-plans', savedState);
            setSelectedPlan(planToRestore);
            setIsResolveModalOpen(true);
          }
        } catch (error) {
          logger.error('Erro ao restaurar estado do modal', 'action-plans', error);
        } finally {
          // Limpa o estado depois de tentar restaurar, para não ficar em loop
          sessionStorage.removeItem(ACTION_PLAN_MODAL_STATE);
        }
      }
    }
  }, [actionPlans]);


  useEffect(() => {
    const fetchActionPlans = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const allPlans: ActionPlan[] = [];

        // Buscar inspeções de todas as tabelas que podem ter planos de ação
        const inspectionTables = [
          { name: 'inspecoes_scba', type: 'scba', idField: 'numero_serie_equipamento', dateField: 'data_inspecao', typeLabel: 'SCBA' },
          { name: 'inspecoes_multigas', type: 'multigas', idField: 'id_equipamento', dateField: 'data_teste', typeLabel: 'Multigás' },
          { name: 'inspecoes_camaras_espuma', type: 'camara_espuma', idField: 'id_camara', dateField: 'data_inspecao', typeLabel: 'Câmara de Espuma' },
          { name: 'inspecoes_canhoes_monitores', type: 'canhao_monitor', idField: 'id_equipamento', dateField: 'data_inspecao', typeLabel: 'Canhão Monitor' },
          { name: 'inspecoes_chuveiros_lava_olhos', type: 'chuveiro_lavaolhos', idField: 'id_equipamento', dateField: 'data_inspecao', typeLabel: 'Chuveiro/Lava-olhos' },
          { name: 'inspecoes_alarmes', type: 'alarme', idField: 'id_sistema', dateField: 'data_inspecao', typeLabel: 'Alarme' },
          { name: 'inspecoes_abrigos', type: 'abrigo', idField: 'id_abrigo', dateField: 'data_inspecao', typeLabel: 'Abrigo' },
          { name: 'inspecoes_mangueiras', type: 'mangueira', idField: 'id_mangueira', dateField: 'data_inspecao', typeLabel: 'Mangueira' },
          { name: 'inspecoes_extintores', type: 'extintor', idField: 'numero_identificacao', dateField: 'data_servico', typeLabel: 'Extintor' },
        ];

        // Buscar inspeções de equipamentos customizados
        const { data: customInspections } = await supabase
          .from('custom_equipment_inspections')
          .select('*')
          .eq('user_id', user.id)
          .order('data_inspecao', { ascending: false });

        // Buscar nomes dos tipos customizados
        const { getAllCustomEquipmentTypes } = await import('../utils/customEquipmentOperations');
        const customTypes = await getAllCustomEquipmentTypes();
        const customTypeMap = new Map(customTypes.map(t => [t.id, { name: t.name, slug: t.slug }]));

        const queries = inspectionTables.map(table => 
          supabase
            .from(table.name as any)
            .select('*')
            .eq('user_id', user.id)
            .order(table.dateField, { ascending: false })
        );

        const results = await Promise.all(queries);

        results.forEach((result, index) => {
          // Ignora erros de coluna não encontrada (tabelas que ainda não têm plano_de_acao)
          if (result.error && result.error.message?.includes('column') && result.error.message?.includes('plano_de_acao')) {
            logger.warn(`Tabela ${inspectionTables[index].name} não possui coluna plano_de_acao`, 'action-plans');
            return;
          }
          
          if (result.data && result.error === null) {
            const tableConfig = inspectionTables[index];
            result.data.forEach((insp: any) => {
              // Só adiciona se tiver plano de ação e não for apenas "Manter em monitoramento"
              const plan = insp.plano_de_acao;
              if (plan && !plan.toLowerCase().includes('manter em monitoramento') && plan.trim() !== 'N/A') {
                // Para extintores, verifica aprovado_inspecao; para multigas, resultado_teste; para outros, status_geral
                const statusValue = tableConfig.type === 'extintor' 
                  ? insp.aprovado_inspecao 
                  : tableConfig.type === 'multigas'
                  ? insp.resultado_teste
                  : insp.status_geral;
                const statusLower = (statusValue || '').toLowerCase();
                const isResolved = statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower === 'sim';
                const createdAt = insp[tableConfig.dateField] || insp.created_at;
                const priority = classifyActionPlanPriority(plan);
                const planStatus = createdAt ? getActionPlanStatus(plan, createdAt) : undefined;
                
                allPlans.push({
                  id: insp.id,
                  type: tableConfig.typeLabel,
                  equipmentType: tableConfig.type,
                  equipmentId: insp[tableConfig.idField],
                  date: createdAt,
                  status: isResolved ? 'resolved' : 'pending',
                  actionPlan: plan,
                  inspector: insp.inspetor || insp.inspetor_responsavel,
                  photoUrl: insp.link_foto_nao_conformidade,
                  inspectionId: insp.id,
                  tableName: tableConfig.name,
                  statusGeral: statusValue || insp.status_geral || insp.resultado_teste,
                  priority,
                  planStatus,
                });
              }
            });
          }
        });

        // Processar inspeções de equipamentos customizados
        if (customInspections) {
          customInspections.forEach((insp: any) => {
            const plan = insp.plano_de_acao;
            if (plan && !plan.toLowerCase().includes('manter em monitoramento') && plan.trim() !== 'N/A') {
              const statusValue = insp.status_geral;
              const statusLower = (statusValue || '').toLowerCase();
              const isResolved = statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower === 'sim';
              const createdAt = insp.data_inspecao || insp.created_at;
              const priority = classifyActionPlanPriority(plan);
              const planStatus = createdAt ? getActionPlanStatus(plan, createdAt) : undefined;
              const typeInfo = customTypeMap.get(insp.equipment_type_id);
              
              allPlans.push({
                id: insp.id,
                type: typeInfo?.name || 'Equipamento Customizado',
                equipmentType: typeInfo ? `custom-${typeInfo.slug}` : 'custom',
                equipmentId: insp.id_equipamento,
                date: createdAt,
                status: isResolved ? 'resolved' : 'pending',
                actionPlan: plan,
                inspector: insp.inspetor,
                photoUrl: insp.link_foto_nao_conformidade,
                inspectionId: insp.id,
                tableName: 'custom_equipment_inspections',
                statusGeral: statusValue,
                priority,
                planStatus,
              });
            }
          });
        }

        // Ordenar por data (mais recentes primeiro)
        allPlans.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });

        setActionPlans(allPlans);
      } catch (err: any) {
        logger.error('Erro ao buscar planos de ação', 'action-plans', err);
        handleError(err, 'action-plans', 'Falha ao carregar planos de ação');
      } finally {
        setLoading(false);
      }
    };

    fetchActionPlans();
  }, [user, handleError]);

  const handleResolveClick = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    setResolveEvidenceFile(null);
    setIsResolveModalOpen(true);
  };

  const handleMarkAsResolved = async () => {
    if (!user || !selectedPlan) return;
    
    setIsUpdating(true);
    try {
      let evidenceUrl: string | null = null;

      // Faz upload da evidência se houver arquivo
      // IMPORTANTE: Todas as evidências são comprimidas antes do upload
      if (resolveEvidenceFile) {
        const folderMap: Record<string, string> = {
          extintor: 'evidencia_resolucao_extintor',
          chuveiro_lavaolhos: 'evidencia_resolucao_chuveiro',
          camara_espuma: 'evidencia_resolucao_camara_espuma',
          alarme: 'evidencia_resolucao_alarme',
          canhao_monitor: 'evidencia_resolucao_canhao_monitor',
          multigas: 'evidencia_resolucao_multigas',
          scba: 'evidencia_resolucao_scba',
          abrigo: 'evidencia_resolucao_abrigo',
          mangueira: 'evidencia_resolucao_mangueira',
        };

        const folder = folderMap[selectedPlan.equipmentType] || 'evidencia_resolucao';

        // SEMPRE comprime antes do upload
        // uploadEvidencePhoto e uploadFile já fazem compressão automática
        if (resolveEvidenceFile.type.startsWith('image/')) {
          // Para imagens, usa uploadEvidencePhoto que SEMPRE comprime
          logger.info('Fazendo upload de imagem de evidência (será comprimida)', 'action-plans', {
            originalSize: resolveEvidenceFile.size,
            fileName: resolveEvidenceFile.name
          });
          
          const uploadResult = await uploadEvidencePhoto(
            resolveEvidenceFile,
            selectedPlan.equipmentId,
            folder,
            false // Não criar thumbnail para evidências de resolução
          );
          evidenceUrl = uploadResult?.url || null;
        } else {
          // Para documentos, usa uploadFile que comprime se for imagem
          // Para PDFs e outros documentos, mantém o arquivo original mas valida tamanho
          logger.info('Fazendo upload de documento de evidência', 'action-plans', {
            originalSize: resolveEvidenceFile.size,
            fileName: resolveEvidenceFile.name,
            fileType: resolveEvidenceFile.type
          });
          
          // Valida tamanho máximo para documentos (10MB)
          const maxDocumentSize = 10 * 1024 * 1024; // 10MB
          if (resolveEvidenceFile.size > maxDocumentSize) {
            throw new Error(`Arquivo muito grande. Tamanho máximo: 10MB. Tamanho atual: ${(resolveEvidenceFile.size / 1024 / 1024).toFixed(2)}MB`);
          }
          
          evidenceUrl = await uploadFile(
            resolveEvidenceFile,
            'evidence-photos',
            folder
          );
        }

        if (!evidenceUrl) {
          throw new Error('Falha ao fazer upload da evidência');
        }
        
        logger.info('Evidência enviada com sucesso', 'action-plans', {
          url: evidenceUrl,
          originalSize: resolveEvidenceFile.size
        });
      }

      // Mapear tipo de equipamento para tabela log_acoes correspondente
      // Nota: nem todos os tipos têm tabela log_acoes (ex: mangueiras)
      const logTableMap: Record<string, string> = {
        extintor: 'log_acoes_extintores',
        chuveiro_lavaolhos: 'log_acoes_chuveiros_lava_olhos',
        camara_espuma: 'log_acoes_camaras_espuma',
        alarme: 'log_acoes_alarmes',
        canhao_monitor: 'log_acoes_canhoes_monitores',
        multigas: 'log_acoes_multigas',
        scba: 'log_acoes_scba',
        abrigo: 'log_acoes_abrigos',
        // mangueira não tem tabela log_acoes_mangueiras
      };

      const logTableName = logTableMap[selectedPlan.equipmentType];
      
      // Criar registro na tabela log_acoes com a evidência
      if (logTableName) {
        const logData: any = {
          id_equipamento: selectedPlan.equipmentId,
          problema_original: selectedPlan.actionPlan,
          acao_realizada: 'Plano de ação resolvido',
          data_acao: new Date().toISOString().split('T')[0],
          responsavel_acao: user.email || 'Usuário',
          user_id: user.id,
        };

        // Adicionar photo_link se houver evidência
        if (evidenceUrl) {
          logData.photo_link = evidenceUrl;
        }

        const { error: logError } = await supabase
          .from(logTableName as any)
          .insert(logData);

        if (logError) {
          logger.error('Erro ao salvar log de ação', 'action-plans', logError);
          // Continua mesmo se o log falhar
        }
      }

      // Atualizar o status da inspeção para "Aprovado" ou similar
      const statusUpdate: any = selectedPlan.equipmentType === 'multigas' 
        ? { 
            resultado_teste: 'Aprovado'
          }
        : selectedPlan.equipmentType === 'extintor'
        ? {
            aprovado_inspecao: 'Sim'
          }
        : { 
            status_geral: 'Aprovado'
          };

      const { error } = await supabase
        .from(selectedPlan.tableName as any)
        .update(statusUpdate)
        .eq('id', selectedPlan.inspectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualizar o estado local
      const newStatusGeral = selectedPlan.equipmentType === 'multigas' 
        ? 'Aprovado'
        : selectedPlan.equipmentType === 'extintor'
        ? 'Sim'
        : 'Aprovado';
      
      setActionPlans(prev => 
        prev.map(p => 
          p.id === selectedPlan.id && p.tableName === selectedPlan.tableName
            ? { ...p, status: 'resolved', statusGeral: newStatusGeral }
            : p
        )
      );

      // Atualiza o cache imediatamente para que as alterações apareçam
      try {
        await refreshCache();
      } catch (error) {
        console.error('Erro ao atualizar cache:', error);
      }

      showSuccess(t('actionPlans.resolveSuccess', { defaultValue: 'Plano de ação marcado como resolvido com sucesso' }));
      setIsResolveModalOpen(false);
      setSelectedPlan(null);
      setResolveEvidenceFile(null);
      sessionStorage.removeItem(ACTION_PLAN_MODAL_STATE);

      // Disparar evento para atualizar notificações no DashboardHeader
      window.dispatchEvent(new CustomEvent('refresh-alerts'));
    } catch (err: any) {
      logger.error('Erro ao marcar plano como resolvido', 'action-plans', err);
      handleError(err, 'action-plans', 'Falha ao atualizar status do plano de ação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelResolve = () => {
    setIsResolveModalOpen(false);
    setSelectedPlan(null);
    setResolveEvidenceFile(null);
    sessionStorage.removeItem(ACTION_PLAN_MODAL_STATE);
  };

  const handleDeleteClick = (plan: ActionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !planToDelete) return;

    setDeletingPlanId(planToDelete.inspectionId);
    try {
      // Remove o plano de ação da inspeção (define como null)
      const { error } = await supabase
        .from(planToDelete.tableName as any)
        .update({ plano_de_acao: null })
        .eq('id', planToDelete.inspectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove do estado local
      setActionPlans(prev => 
        prev.filter(p => !(p.id === planToDelete.id && p.tableName === planToDelete.tableName))
      );

      // Atualiza o cache imediatamente para que as alterações apareçam
      try {
        await refreshCache();
      } catch (error) {
        console.error('Erro ao atualizar cache:', error);
      }

      showSuccess(t('actionPlans.deleteSuccess', { defaultValue: 'Plano de ação excluído com sucesso' }));
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    } catch (err: any) {
      logger.error('Erro ao excluir plano de ação', 'action-plans', err);
      handleError(err, 'action-plans', 'Falha ao excluir plano de ação');
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  const filteredPlans = actionPlans.filter(plan => {
    if (filter === 'all') return true;
    if (filter === 'pending') return plan.status === 'pending';
    if (filter === 'resolved') return plan.status === 'resolved';
    return true;
  });

  const getStatusIcon = (status: string) => {
    if (status === 'resolved') {
      return <CheckCircle size={20} style={{ color: '#53D769' }} />;
    }
    return <AlertCircle size={20} style={{ color: '#FC3D39' }} />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved') {
      return 'rgba(83, 215, 105, 0.2)';
    }
    return 'rgba(252, 61, 57, 0.2)';
  };

  const getStatusTextColor = (status: string) => {
    if (status === 'resolved') {
      return '#53D769';
    }
    return '#FC3D39';
  };

  const handleViewEquipment = (plan: ActionPlan) => {
    navigate(`/equipment/${plan.equipmentType}/${plan.equipmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title={{ key: 'actionPlans.title', defaultValue: 'Planos de Ação' }} />
        <main className="p-4">
          <div className="flex items-center justify-center py-12">
            <LoadingScreen size="lg" color="blue" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'actionPlans.title', defaultValue: 'Planos de Ação' }} />
      <main className="p-4 pb-32">
        {/* Filtros */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-white text-black'
                : 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
            }`}
          >
            {t('actionPlans.all', { defaultValue: 'Todos' })} ({actionPlans.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'pending'
                ? 'bg-white text-black'
                : 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
            }`}
          >
            {t('actionPlans.pending', { defaultValue: 'Pendentes' })} ({actionPlans.filter(p => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'resolved'
                ? 'bg-white text-black'
                : 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
            }`}
          >
            {t('actionPlans.resolved', { defaultValue: 'Resolvidos' })} ({actionPlans.filter(p => p.status === 'resolved').length})
          </button>
        </div>

        {/* Lista de Planos de Ação */}
        {filteredPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText size={48} className="mx-auto mb-4" style={{ color: '#8E8E93' }} />
            <p className="text-lg font-medium mb-2" style={{ color: '#FFFFFF' }}>
              {t('actionPlans.noPlans', { defaultValue: 'Nenhum plano de ação encontrado' })}
            </p>
            <p className="text-sm" style={{ color: '#8E8E93' }}>
              {t('actionPlans.noPlansDescription', { defaultValue: 'Quando houver não conformidades, os planos de ação aparecerão aqui.' })}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredPlans.map((plan) => (
                <motion.div
                  key={`${plan.tableName}-${plan.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.9)',
                    borderColor: '#2A2A2A',
                    borderWidth: '1px',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getStatusIcon(plan.status)}
                        <h3 className="font-semibold text-white">{plan.type}</h3>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ 
                          backgroundColor: getStatusColor(plan.status),
                          color: getStatusTextColor(plan.status)
                        }}>
                          {plan.status === 'resolved' 
                            ? t('actionPlans.resolved', { defaultValue: 'Resolvido' })
                            : t('actionPlans.pending', { defaultValue: 'Pendente' })}
                        </span>
                        {plan.priority && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            backgroundColor: plan.priority === 'critical' 
                              ? 'rgba(252, 61, 57, 0.2)'
                              : plan.priority === 'important'
                              ? 'rgba(255, 149, 0, 0.2)'
                              : 'rgba(142, 142, 147, 0.2)',
                            color: plan.priority === 'critical'
                              ? '#FC3D39'
                              : plan.priority === 'important'
                              ? '#FF9500'
                              : '#8E8E93'
                          }}>
                            {plan.priority === 'critical'
                              ? t('actionPlans.critical', { defaultValue: 'Crítico' })
                              : plan.priority === 'important'
                              ? t('actionPlans.important', { defaultValue: 'Importante' })
                              : t('actionPlans.normal', { defaultValue: 'Normal' })}
                          </span>
                        )}
                        {plan.planStatus && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            backgroundColor: plan.planStatus.isOverdue
                              ? 'rgba(252, 61, 57, 0.2)'
                              : plan.planStatus.daysRemaining <= 7
                              ? 'rgba(255, 149, 0, 0.2)'
                              : 'rgba(142, 142, 147, 0.2)',
                            color: plan.planStatus.isOverdue
                              ? '#FC3D39'
                              : plan.planStatus.daysRemaining <= 7
                              ? '#FF9500'
                              : '#8E8E93'
                          }}>
                            {getActionPlanStatusMessage(plan.planStatus)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#8E8E93] mb-1">
                        {t('actionPlans.equipment', { defaultValue: 'Equipamento' })}: {plan.equipmentId}
                      </p>
                      <p className="text-xs text-[#8E8E93]">
                        {format(new Date(plan.date), 'dd/MM/yyyy', { 
                          locale: currentLanguage === 'pt-BR' ? ptBR : enUS 
                        })}
                        {plan.inspector && ` • ${t('actionPlans.inspector', { defaultValue: 'Inspetor' })}: ${plan.inspector}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(plan)}
                      disabled={deletingPlanId === plan.inspectionId}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20 active:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-2 touch-manipulation"
                      style={{ 
                        color: '#FC3D39',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                      }}
                      aria-label={t('actionPlans.delete', { defaultValue: 'Excluir plano de ação' })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(18, 18, 18, 0.5)' }}>
                    <p className="text-sm text-white whitespace-pre-wrap">{plan.actionPlan}</p>
                  </div>

                  {plan.photoUrl && (
                    <div className="mb-3">
                      <img
                        src={plan.photoUrl}
                        alt="Foto de não conformidade"
                        className="w-full h-32 object-cover rounded-lg"
                        onClick={() => window.open(plan.photoUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewEquipment(plan)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }}
                    >
                      <Eye size={16} className="inline mr-2" />
                      {t('actionPlans.viewEquipment', { defaultValue: 'Ver Equipamento' })}
                    </button>
                    {plan.status === 'pending' && (
                      <button
                        onClick={() => handleResolveClick(plan)}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ 
                          backgroundColor: '#53D769',
                          color: '#000000'
                        }}
                      >
                        <Check size={16} className="inline mr-2" />
                        {t('actionPlans.markResolved', { defaultValue: 'Marcar como Resolvido' })}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('actionPlans.deleteTitle', { defaultValue: 'Excluir Plano de Ação' })}
        message={t('actionPlans.deleteConfirm', { defaultValue: 'Tem certeza que deseja excluir este plano de ação?' })}
        isLoading={deletingPlanId !== null}
      />

      {/* Modal de Resolução com Upload de Evidência */}
      <AnimatePresence>
        {isResolveModalOpen && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleCancelResolve}
            style={{ touchAction: 'manipulation' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ 
                type: 'tween', 
                ease: [0.4, 0, 0.2, 1], 
                duration: 0.25 
              }}
              className="bg-[#1C1C1E] rounded-lg shadow-xl w-full max-w-md m-4 p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {t('actionPlans.resolveTitle', { defaultValue: 'Resolver Plano de Ação' })}
              </h3>
              
              <div className="mb-4 p-3 rounded-lg bg-[#121212]">
                <p className="text-sm text-[#8E8E93] mb-1">
                  {t('actionPlans.equipment', { defaultValue: 'Equipamento' })}: {selectedPlan.equipmentId}
                </p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedPlan.actionPlan}</p>
              </div>

              <FileUpload
                value={resolveEvidenceFile}
                onChange={setResolveEvidenceFile}
                label={t('actionPlans.evidenceLabel', { defaultValue: 'Evidência de Resolução (Opcional)' })}
                required={false}
                accept="image/*,application/pdf,.doc,.docx"
                maxSizeMB={10}
              />

              <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  className="w-full justify-center rounded-md bg-[#2A2A2A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3A3A3A] active:bg-[#4A4A4A] sm:w-auto touch-manipulation min-h-[44px]"
                  onClick={handleCancelResolve}
                  disabled={isUpdating}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {t('common.cancel', { defaultValue: 'Cancelar' })}
                </button>
                <button
                  type="button"
                  className="w-full justify-center rounded-md bg-[#53D769] px-4 py-3 text-sm font-semibold text-black hover:bg-[#63E779] active:bg-[#43C759] sm:w-auto disabled:bg-[#53D769]/50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                  onClick={handleMarkAsResolved}
                  disabled={isUpdating}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" color="black" />
                      <span>{t('actionPlans.resolving', { defaultValue: 'Resolvendo...' })}</span>
                    </div>
                  ) : (
                    <>
                      <Check size={16} className="inline mr-2" />
                      {t('actionPlans.confirmResolve', { defaultValue: 'Confirmar Resolução' })}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionPlansPage;

