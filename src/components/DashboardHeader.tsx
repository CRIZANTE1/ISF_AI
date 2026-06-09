import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, X, RefreshCw, WifiOff, CheckCircle, Lightbulb } from 'lucide-react';
import LazyImage from './LazyImage';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { useTranslation } from '../hooks/useTranslation';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { supabase } from '../lib/supabase';
import { isActionPlanOverdue, getActionPlanStatus, classifyActionPlanPriority } from '../utils/actionPlanUtils';
import { logger } from '../utils/logger';
import { 
  notifyMultipleAlerts, 
  notifyPendingIssues,
  notifyMaintenanceRequired 
} from '../utils/notificationUtils';

interface Alert {
  id: string;
  equipment_id: string;
  equipment_type: string;
  status: string;
  proxima_inspecao?: string;
  message: string;
}

const DashboardHeader = () => {
  const { profile, user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const { cache } = useEquipmentCache();
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { pendingOperations, isSyncing, lastSyncResult, hasError, errorMessage, sync, clearError } = useSyncStatus();
  const today = new Date();
  const locale = currentLanguage === 'pt-BR' ? ptBR : enUS;
  const localeString = currentLanguage === 'pt-BR' ? 'pt-BR' : 'en-US';
  let formattedDate = '';
  try {
    const formatPattern = currentLanguage === 'pt-BR' 
      ? "EEEE, d 'de' MMMM" 
      : "EEEE, MMMM d";
    formattedDate = format(today, formatPattern, { locale }) || '';
  } catch (error) {
    formattedDate = today.toLocaleDateString(localeString) || '';
  }
  // Garantir que formattedDate nunca seja undefined ou null
  if (!formattedDate || typeof formattedDate !== 'string') {
    formattedDate = today.toLocaleDateString(localeString, { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }) || t('common.dateNotAvailable', { defaultValue: 'Data não disponível' });
  }
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 'U';

  // Buscar alertas
  useEffect(() => {
    if (!user?.id) return;

    const fetchAlerts = async () => {
      const allAlerts: Alert[] = [];

      const checkEquipment = (
        equipmentList: any[],
        type: string,
        idField: string,
        statusField?: string,
        nextInspectionField?: string
      ) => {
        equipmentList
          .filter((eq: any) => !eq.user_id || eq.user_id === user.id)
          .forEach((eq: any) => {
            const id = eq[idField] || eq.id || String(eq.id);
            const status = eq[statusField || 'status'] || 'ok';
            const nextInspection = eq[nextInspectionField || 'proxima_inspecao'] || eq.data_proxima_inspecao;

            if (nextInspection) {
              const inspectionDate = new Date(nextInspection);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (inspectionDate < today) {
                allAlerts.push({
                  id: `${type}_${id}`,
                  equipment_id: id,
                  equipment_type: type,
                  status: 'vencido',
                  proxima_inspecao: nextInspection,
                  message: t('alerts.inspectionExpired', { id, defaultValue: `${id} está com inspeção vencida.` }),
                });
              } else if (status === 'pendente' || status === 'nao_conforme') {
                allAlerts.push({
                  id: `${type}_${id}`,
                  equipment_id: id,
                  equipment_type: type,
                  status: 'pendente',
                  proxima_inspecao: nextInspection,
                  message: t('alerts.hasPending', { id, defaultValue: `${id} possui pendências.` }),
                });
              }
            }
          });
      };

      // Verificar extintores com lógica especial (múltiplas datas)
      cache.extinguishers.forEach((eq: any) => {
        if (!eq.user_id || eq.user_id === user.id) {
          const id = eq.numero_identificacao;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Verifica todas as datas relevantes de extintores
          const datesToCheck = [
            { date: eq.data_proxima_inspecao, label: 'inspeção' },
            { date: eq.data_proxima_manutencao_2_nivel, label: 'manutenção nível 2' },
            { date: eq.data_proxima_manutencao_3_nivel, label: 'manutenção nível 3' },
          ].filter(d => d.date);

          datesToCheck.forEach(({ date, label }) => {
            const inspectionDate = new Date(date);
            inspectionDate.setHours(0, 0, 0, 0);

            if (inspectionDate < today) {
              allAlerts.push({
                id: `extintor_${id}_${label}`,
                equipment_id: id,
                equipment_type: 'extintor',
                status: 'vencido',
                proxima_inspecao: date,
                message: t('alerts.inspectionExpired', { id, defaultValue: `${id} está com ${label} vencida.` }),
              });
            }
          });

          // Verifica status pendente/reprovado (não aprovado)
          // Prioriza status_geral (campo principal do banco: 'aprovado', 'pendente', 'reprovado')
          const statusGeral = (eq.status_geral || '').toLowerCase().trim();
          const aprovado = (eq.aprovado_inspecao || '').toLowerCase().trim();
          
          const isPending = statusGeral === 'pendente' || statusGeral === 'reprovado' || 
                           aprovado === 'não' || aprovado === 'nao' || aprovado === 'pendente';
          
          if (isPending) {
            allAlerts.push({
              id: `extintor_${id}_pendente`,
              equipment_id: id,
              equipment_type: 'extintor',
              status: 'pendente',
              proxima_inspecao: eq.data_proxima_inspecao,
              message: t('alerts.hasPending', { id, defaultValue: `${id} possui pendências (${eq.status_geral || eq.aprovado_inspecao || 'Não aprovado'}).` }),
            });
          }
        }
      });
      checkEquipment(cache.hoses, 'mangueira', 'id_mangueira', 'resultado', 'data_proximo_teste');
      checkEquipment(cache.scbas, 'scba', 'numero_serie_equipamento', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.multigasDetectors, 'multigas', 'id_equipamento', 'status', 'data_proximo_teste');
      checkEquipment(cache.foamChambers, 'camara_espuma', 'id_camara', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.cannonMonitors, 'canhao_monitor', 'id_equipamento', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.eyewashStations, 'chuveiro_lavaolhos', 'id_equipamento', 'status_geral', 'data_proxima_inspecao');
      checkEquipment(cache.alarmSystems, 'alarme', 'id_sistema', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.shelters, 'abrigo', 'id_abrigo', 'status', 'data_proxima_inspecao');

      // Buscar planos de ação vencidos
      try {
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

        for (const table of inspectionTables) {
          try {
            const { data, error } = await supabase
              .from(table.name as any)
              .select('*')
              .eq('user_id', user.id)
              .not('plano_de_acao', 'is', null);

            if (error) {
              // Ignora erros de coluna não encontrada
              if (error.message?.includes('column') && error.message?.includes('plano_de_acao')) {
                continue;
              }
              logger.warn(`Erro ao buscar planos de ação de ${table.name}`, 'alerts', error);
              continue;
            }

            if (data) {
              data.forEach((insp: any) => {
                const plan = insp.plano_de_acao;
                if (!plan || plan.toLowerCase().includes('manter em monitoramento') || plan.trim() === 'N/A') {
                  return;
                }

                // Verificar se o plano de ação já foi resolvido verificando o status da inspeção
                // Para extintores, verifica aprovado_inspecao; para multigas, resultado_teste; para outros, status_geral
                const statusValue = table.type === 'extintor' 
                  ? insp.aprovado_inspecao 
                  : table.type === 'multigas'
                  ? insp.resultado_teste
                  : insp.status_geral;
                const statusLower = (statusValue || '').toLowerCase();
                const isResolved = statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower === 'sim';
                
                // Se o plano foi resolvido, não criar alerta
                if (isResolved) {
                  return;
                }

                const createdAt = insp[table.dateField] || insp.created_at;
                if (!createdAt) return;

                if (isActionPlanOverdue(plan, createdAt)) {
                  const status = getActionPlanStatus(plan, createdAt);
                  const priority = classifyActionPlanPriority(plan);
                  const priorityLabel = priority === 'critical' 
                    ? t('alerts.critical', { defaultValue: 'Crítico' })
                    : priority === 'important'
                    ? t('alerts.important', { defaultValue: 'Importante' })
                    : t('alerts.normal', { defaultValue: 'Normal' });

                  allAlerts.push({
                    id: `action_plan_${table.name}_${insp.id}`,
                    equipment_id: insp[table.idField],
                    equipment_type: table.type,
                    status: 'action_plan_overdue',
                    message: t('alerts.actionPlanOverdue', {
                      equipment: insp[table.idField],
                      priority: priorityLabel,
                      days: status.daysRemaining,
                      defaultValue: `Plano de ação ${priorityLabel} vencido há ${status.daysRemaining} dia(s) - ${insp[table.idField]}`
                    }),
                  });
                }
              });
            }
          } catch (err) {
            logger.error(`Erro ao processar planos de ação de ${table.name}`, 'alerts', err);
          }
        }
      } catch (err) {
        logger.error('Erro ao buscar planos de ação vencidos', 'alerts', err);
      }

      allAlerts.sort((a, b) => {
        // Prioriza planos de ação vencidos
        if (a.status === 'action_plan_overdue' && b.status !== 'action_plan_overdue') return -1;
        if (a.status !== 'action_plan_overdue' && b.status === 'action_plan_overdue') return 1;
        
        if (!a.proxima_inspecao) return 1;
        if (!b.proxima_inspecao) return -1;
        return new Date(a.proxima_inspecao).getTime() - new Date(b.proxima_inspecao).getTime();
      });

      setAlerts(allAlerts);

      // Envia notificações de alertas
      if (allAlerts.length > 0) {
        // Notifica múltiplos alertas
        if (allAlerts.length > 1) {
          notifyMultipleAlerts(allAlerts.length).catch(err => {
            logger.error('Erro ao enviar notificação de múltiplos alertas', 'notifications', err);
          });
        }

        // Notifica pendências e manutenções individuais
        allAlerts.forEach(alert => {
          if (alert.status === 'pendente' || alert.status === 'nao_conforme') {
            const equipmentType = t(`equipment.${alert.equipment_type}`, { defaultValue: alert.equipment_type });
            notifyPendingIssues(alert.equipment_id, equipmentType).catch(err => {
              logger.error('Erro ao enviar notificação de pendências', 'notifications', err);
            });
          }
          
          // Verifica se é manutenção (nível 2 ou 3)
          if (alert.message.includes('manutenção nível 2')) {
            const equipmentType = t(`equipment.${alert.equipment_type}`, { defaultValue: alert.equipment_type });
            notifyMaintenanceRequired(alert.equipment_id, equipmentType, 2).catch(err => {
              logger.error('Erro ao enviar notificação de manutenção', 'notifications', err);
            });
          } else if (alert.message.includes('manutenção nível 3')) {
            const equipmentType = t(`equipment.${alert.equipment_type}`, { defaultValue: alert.equipment_type });
            notifyMaintenanceRequired(alert.equipment_id, equipmentType, 3).catch(err => {
              logger.error('Erro ao enviar notificação de manutenção', 'notifications', err);
            });
          }
        });
      }
    };

    fetchAlerts();

    // Escutar eventos de atualização de notificações (quando planos são resolvidos)
    const handleRefreshAlerts = () => {
      fetchAlerts();
    };

    // Escutar evento customizado para atualizar notificações
    window.addEventListener('refresh-alerts', handleRefreshAlerts);

    return () => {
      window.removeEventListener('refresh-alerts', handleRefreshAlerts);
    };
  }, [user?.id, cache, t]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header 
      className="fixed left-0 right-0 top-0 border-b"
      style={{ 
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        paddingBottom: '12px',
        zIndex: 50,
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col"
        >
          <h1 className="text-screen-title font-semibold text-white mb-1" style={{ letterSpacing: '-0.5px' }}>
            {formattedDate && formattedDate.includes(',') ? formattedDate.split(',')[0] : formattedDate}
          </h1>
          <p className="text-body text-[#8E8E93]">
            {formattedDate && formattedDate.includes(',') ? formattedDate.split(',')[1]?.trim() || '' : ''}
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full transition-colors hover:bg-[rgba(28,28,30,0.8)]"
              aria-label={t('dashboard.notifications')}
            >
              <Bell size={22} strokeWidth={2} className="text-[#8E8E93]" />
              {/* Indicador de alertas */}
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-error"></span>
              )}
              {/* Indicador de sincronização pendente (amarelo) */}
              {pendingOperations > 0 && alerts.length === 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-500"></span>
              )}
              {/* Indicador de erro de sincronização (vermelho) */}
              {hasError && pendingOperations > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-error animate-pulse"></span>
              )}
            </motion.button>

            {/* Dropdown de Notificações */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-ios-lg border border-[var(--border-current)] shadow-apple-lg z-50"
                  style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.95)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                  <div className="p-4 border-b border-[var(--border-current)] flex items-center justify-between">
                    <h3 className="font-semibold text-white">{t('dashboard.notifications')}</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label={t('common.close')}
                    >
                      <X size={18} className="text-[#8E8E93]" />
                    </button>
                  </div>
                  
                  {/* Status de Sincronização */}
                  {pendingOperations > 0 && (
                    <div className={`p-3 border-b border-[var(--border-current)] ${
                      hasError ? 'bg-red-500/10' : 'bg-yellow-500/10'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isSyncing ? (
                            <RefreshCw size={16} className="text-yellow-500 animate-spin flex-shrink-0" />
                          ) : hasError ? (
                            <WifiOff size={16} className="text-red-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">
                              {isSyncing 
                                ? `Sincronizando ${pendingOperations} operação(ões)...`
                                : hasError
                                ? errorMessage || `${pendingOperations} operação(ões) pendente(s)`
                                : `${pendingOperations} operação(ões) pendente(s)`
                              }
                            </p>
                            {lastSyncResult && (
                              <p className="text-xs text-[#8E8E93] mt-0.5">
                                {lastSyncResult.success > 0 && `${lastSyncResult.success} sincronizada(s)`}
                                {lastSyncResult.success > 0 && lastSyncResult.failed > 0 && ' • '}
                                {lastSyncResult.failed > 0 && `${lastSyncResult.failed} falharam`}
                              </p>
                            )}
                          </div>
                        </div>
                        {!isSyncing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sync();
                            }}
                            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-1"
                          >
                            <RefreshCw size={12} />
                            Sincronizar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-[#8E8E93] text-sm">{t('dashboard.noNotifications')}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border-current)]">
                        {alerts.map((alert) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setShowNotifications(false);
                              navigate(`/equipment/${alert.equipment_type}/${alert.equipment_id}`);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle 
                                size={20} 
                                className="text-status-error flex-shrink-0 mt-0.5" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white mb-1">
                                  {alert.message}
                                </p>
                                {alert.proxima_inspecao && (
                                  <p className="text-xs text-[#8E8E93]">
                                    {format(new Date(alert.proxima_inspecao), "dd/MM/yyyy", { locale })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-apple-sm transition-all hover:shadow-apple-md overflow-hidden"
            style={{ 
              backgroundColor: profile?.avatar_url ? 'transparent' : '#FFFFFF',
              boxShadow: profile?.avatar_url ? '0 2px 8px rgba(255, 255, 255, 0.2)' : '0 2px 8px rgba(255, 255, 255, 0.3)'
            }}
            aria-label={t('dashboard.profile')}
          >
            {profile?.avatar_url ? (
              <LazyImage 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Avatar'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-black">{userInitial}</span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
