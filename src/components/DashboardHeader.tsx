import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, X } from 'lucide-react';
import LazyImage from './LazyImage';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';

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
  const navigate = useNavigate();
  const { cache } = useEquipmentCache();
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  let formattedDate = '';
  try {
    formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: ptBR }) || '';
  } catch (error) {
    formattedDate = today.toLocaleDateString('pt-BR') || '';
  }
  // Garantir que formattedDate nunca seja undefined ou null
  if (!formattedDate || typeof formattedDate !== 'string') {
    formattedDate = today.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }) || 'Data não disponível';
  }
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 'U';

  // Buscar alertas
  useEffect(() => {
    if (!user?.id) return;

    const fetchAlerts = () => {
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
                  message: `${id} está com inspeção vencida.`,
                });
              } else if (status === 'pendente' || status === 'nao_conforme') {
                allAlerts.push({
                  id: `${type}_${id}`,
                  equipment_id: id,
                  equipment_type: type,
                  status: 'pendente',
                  proxima_inspecao: nextInspection,
                  message: `${id} possui pendências.`,
                });
              }
            }
          });
      };

      checkEquipment(cache.extinguishers, 'extintor', 'numero_identificacao', 'status', 'proxima_inspecao');
      checkEquipment(cache.hoses, 'mangueira', 'id_mangueira', 'resultado', 'data_proximo_teste');
      checkEquipment(cache.scbas, 'scba', 'numero_serie_equipamento', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.multigasDetectors, 'multigas', 'id_equipamento', 'status', 'data_proximo_teste');
      checkEquipment(cache.foamChambers, 'camara_espuma', 'id_camara', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.cannonMonitors, 'canhao_monitor', 'id_equipamento', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.eyewashStations, 'chuveiro_lavaolhos', 'id_equipamento', 'status_geral', 'data_proxima_inspecao');
      checkEquipment(cache.alarmSystems, 'alarme', 'id_sistema', 'status', 'data_proxima_inspecao');
      checkEquipment(cache.shelters, 'abrigo', 'id_abrigo', 'status', 'data_proxima_inspecao');

      allAlerts.sort((a, b) => {
        if (!a.proxima_inspecao) return 1;
        if (!b.proxima_inspecao) return -1;
        return new Date(a.proxima_inspecao).getTime() - new Date(b.proxima_inspecao).getTime();
      });

      setAlerts(allAlerts);
    };

    fetchAlerts();
  }, [user?.id, cache]);

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
      className="sticky top-0 frosted-glass border-b border-[var(--border-current)]"
      style={{ 
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        zIndex: 20,
        position: 'sticky',
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
              aria-label="Notificações"
            >
              <Bell size={22} strokeWidth={2} className="text-[#8E8E93]" />
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-error"></span>
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
                    <h3 className="font-semibold text-white">Notificações</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Fechar"
                    >
                      <X size={18} className="text-[#8E8E93]" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-[#8E8E93] text-sm">Nenhuma notificação</p>
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
                                    {format(new Date(alert.proxima_inspecao), "dd/MM/yyyy", { locale: ptBR })}
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
            aria-label="Perfil"
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
