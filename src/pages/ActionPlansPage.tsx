import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
import { logger } from '../utils/logger';
import { getActionPlanStatus, classifyActionPlanPriority, getActionPlanStatusMessage, type ActionPlanPriority } from '../utils/actionPlanUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

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
  const { handleError } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | number | null>(null);
  const [planToDelete, setPlanToDelete] = useState<ActionPlan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
                const statusLower = (insp.status_geral || insp.resultado_teste || '').toLowerCase();
                const isResolved = statusLower.includes('aprovado') || statusLower.includes('ok');
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
                  statusGeral: insp.status_geral || insp.resultado_teste,
                  priority,
                  planStatus,
                });
              }
            });
          }
        });

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

  const handleMarkAsResolved = async (plan: ActionPlan) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Atualizar o status da inspeção para "Aprovado" ou similar
      const statusUpdate = plan.equipmentType === 'multigas' 
        ? { resultado_teste: 'Aprovado' }
        : { status_geral: 'Aprovado' };

      const { error } = await supabase
        .from(plan.tableName as any)
        .update(statusUpdate)
        .eq('id', plan.inspectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualizar o estado local
      setActionPlans(prev => 
        prev.map(p => 
          p.id === plan.id && p.tableName === plan.tableName
            ? { ...p, status: 'resolved', statusGeral: 'Aprovado' }
            : p
        )
      );

      setIsModalOpen(false);
      setSelectedPlan(null);
    } catch (err: any) {
      logger.error('Erro ao marcar plano como resolvido', 'action-plans', err);
      handleError(err, 'action-plans', 'Falha ao atualizar status do plano de ação');
    } finally {
      setIsUpdating(false);
    }
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
            <Spinner size="lg" color="blue" />
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
                        onClick={() => handleMarkAsResolved(plan)}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ 
                          backgroundColor: '#53D769',
                          color: '#000000'
                        }}
                      >
                        {isUpdating ? (
                          <Spinner size="sm" color="white" />
                        ) : (
                          <>
                            <Check size={16} className="inline mr-2" />
                            {t('actionPlans.markResolved', { defaultValue: 'Marcar como Resolvido' })}
                          </>
                        )}
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
    </div>
  );
};

export default ActionPlansPage;

