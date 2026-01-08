import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Calendar, Filter, X } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { parseInspectionDate } from '../utils/dateUtils';
import { useHaptics } from '../hooks/useHaptics';

interface InspectionHistory {
  id: string | number;
  type: string;
  equipmentId: string;
  date: string;
  status: string;
  inspector?: string;
  observations?: string;
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const haptics = useHaptics();
  const [inspections, setInspections] = useState<InspectionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [selectedInspection, setSelectedInspection] = useState<InspectionHistory | null>(null);

  // Função auxiliar para normalizar status (remover "Sim"/"Não" e converter para status apropriado)
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return 'pendente';
    const statusLower = status.toLowerCase().trim();
    
    // Converter "Sim" e "Não" para status apropriado
    if (statusLower === 'sim') return 'aprovado';
    if (statusLower === 'não' || statusLower === 'nao') return 'reprovado';
    
    // Normalizar outros status
    if (statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return 'aprovado';
    }
    if (statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return 'reprovado';
    }
    if (statusLower.includes('vencido')) {
      return 'vencido';
    }
    if (statusLower.includes('pendente')) {
      return 'pendente';
    }
    
    return statusLower; // Retornar status em minúsculas se não for reconhecido
  };

  useEffect(() => {
    const fetchInspections = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const allInspections: InspectionHistory[] = [];

        // Buscar inspeções de todas as tabelas especializadas
        const [
          scbaInspections,
          multigasInspections,
          foamChamberInspections,
          cannonMonitorInspections,
          eyewashInspections,
          alarmInspections,
          shelterInspections,
          hoseInspections,
          extinguisherInspections,
        ] = await Promise.all([
          supabase.from('inspecoes_scba').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_multigas').select('*').eq('user_id', user.id).order('data_teste', { ascending: false }),
          supabase.from('inspecoes_camaras_espuma').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_canhoes_monitores').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_chuveiros_lava_olhos').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_alarmes').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_abrigos').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_mangueiras').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_extintores' as any).select('*').eq('user_id', user.id).order('data_servico', { ascending: false }),
        ]);

        // Buscar inspeções de equipamentos customizados
        const { data: customInspections } = await supabase
          .from('custom_equipment_inspections')
          .select('*')
          .eq('user_id', user.id)
          .order('data_inspecao', { ascending: false });

        // Processar inspeções SCBA
        if (scbaInspections.data) {
          scbaInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'SCBA',
              equipmentId: insp.numero_serie_equipamento,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Multigás
        if (multigasInspections.data) {
          multigasInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Multigás',
              equipmentId: insp.id_equipamento,
              date: insp.data_teste || insp.created_at,
              status: normalizeStatus(insp.resultado_teste),
              inspector: insp.inspetor,
              observations: insp.observacoes,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Câmaras de Espuma
        if (foamChamberInspections.data) {
          foamChamberInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Câmara de Espuma',
              equipmentId: insp.id_camara,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Canhões Monitores
        if (cannonMonitorInspections.data) {
          cannonMonitorInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Canhão Monitor',
              equipmentId: insp.id_equipamento,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Chuveiros/Lava-olhos
        if (eyewashInspections.data) {
          eyewashInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Chuveiro/Lava-olhos',
              equipmentId: insp.id_equipamento,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Alarmes
        if (alarmInspections.data) {
          alarmInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Sistema de Alarme',
              equipmentId: insp.id_sistema,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Abrigos
        if (shelterInspections.data) {
          shelterInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Abrigo',
              equipmentId: insp.id_abrigo,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral),
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Mangueiras
        if (hoseInspections.data) {
          hoseInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'Mangueira',
              equipmentId: insp.id_mangueira,
              date: insp.data_inspecao || insp.created_at,
              status: normalizeStatus(insp.status_geral || insp.resultado),
              inspector: insp.inspetor,
              observations: insp.observacoes || (insp.resultados_json ? JSON.stringify(insp.resultados_json) : null),
              created_at: insp.created_at,
            });
          });
        }

        // Processar inspeções Extintores
        if (extinguisherInspections.data) {
          extinguisherInspections.data.forEach((insp: any) => {
            // Priorizar status_geral, senão usar aprovado_inspecao
            const status = normalizeStatus(insp.status_geral || insp.aprovado_inspecao);
            
            allInspections.push({
              id: insp.id,
              type: 'Extintor',
              equipmentId: insp.numero_identificacao,
              date: insp.data_servico || insp.created_at,
              status: status,
              inspector: insp.inspetor_responsavel,
              observations: insp.observacoes_gerais,
              created_at: insp.created_at,
            });
          });
        }

        // Ordenar por data (mais recente primeiro)
        allInspections.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        setInspections(allInspections);
      } catch (error) {
        handleError(error, 'inspection', 'Erro ao buscar histórico de inspeções');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [user]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // Tratar "Sim" e "Não" também
    if (statusLower === 'sim' || statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return '#53D769'; // Verde
    } else if (statusLower === 'não' || statusLower === 'nao' || statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return '#FC3D39'; // Vermelho
    } else if (statusLower.includes('vencido') || statusLower.includes('pendente')) {
      return '#FFD60A'; // Amarelo
    }
    return '#FFD60A'; // Amarelo (padrão para pendente/vencido)
  };

  const formatStatus = (status: string) => {
    const statusLower = status.toLowerCase();
    // Remover "Sim" e "Não", converter para status apropriado
    if (statusLower === 'sim' || statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return 'Aprovado';
    } else if (statusLower === 'não' || statusLower === 'nao' || statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return 'Reprovado';
    } else if (statusLower.includes('vencido')) {
      return 'Vencido';
    } else if (statusLower.includes('pendente')) {
      return 'Pendente';
    }
    return status; // Fallback para outros status
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'sim' || statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return <CheckCircle size={20} style={{ color: '#53D769' }} />;
    } else if (statusLower === 'não' || statusLower === 'nao' || statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return <XCircle size={20} style={{ color: '#FC3D39' }} />;
    } else if (statusLower.includes('vencido')) {
      return <Clock size={20} style={{ color: '#FFD60A' }} />;
    }
    return <Clock size={20} style={{ color: '#FFD60A' }} />; // Pendente em amarelo
  };

  const filteredInspections = inspections.filter((insp) => {
    if (filter === 'all') return true;
    const statusLower = insp.status.toLowerCase();
    if (filter === 'approved') {
      return statusLower === 'aprovado' || statusLower.includes('ok') || statusLower.includes('aprovada');
    } else if (filter === 'rejected') {
      return statusLower === 'reprovado' || statusLower.includes('reprovada');
    } else if (filter === 'pending') {
      return statusLower === 'pendente' || statusLower === 'vencido' || 
             (!statusLower.includes('aprovado') && !statusLower.includes('reprovado') && !statusLower.includes('ok'));
    }
    return true;
  });

  const groupedByDate = filteredInspections.reduce((acc, insp) => {
    const date = parseInspectionDate(insp.date);
    const dateKey = format(date, 'dd/MM/yyyy', { locale: currentLanguage === 'pt-BR' ? ptBR : enUS });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(insp);
    return acc;
  }, {} as Record<string, InspectionHistory[]>);

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={{ key: 'history.inspectionHistory' }} />
      <main className="p-ios-4 pb-32 relative" style={{ backgroundColor: '#000000' }}>
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mb-ios-6"
        >
          <div className="flex items-center gap-ios-2 mb-ios-4">
            <Filter size={18} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{t('history.filter')}:</span>
          </div>
          <div className="flex gap-ios-2 flex-wrap">
            {[
              { value: 'all', label: t('history.all') },
              { value: 'approved', label: t('history.approved') },
              { value: 'rejected', label: t('history.rejected') },
              { value: 'pending', label: t('history.pending') },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className="px-ios-4 py-ios-2 rounded-ios-lg text-sm font-medium transition-all border"
                style={{
                  backgroundColor: filter === option.value ? 'var(--primary)' : 'var(--card)',
                  color: filter === option.value ? 'var(--primary-foreground)' : 'var(--foreground)',
                  borderColor: filter === option.value ? 'var(--primary)' : 'var(--border)',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lista de Inspeções */}
        {loading ? (
          <div className="space-y-ios-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-ios-lg" />
            ))}
          </div>
        ) : filteredInspections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-ios-8 rounded-lg border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Calendar size={48} className="mx-auto mb-ios-4" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-lg font-semibold mb-ios-2" style={{ color: 'var(--foreground)' }}>{t('history.noHistory')}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {filter === 'all' 
                ? t('inspection.noInspections')
                : `${t('history.noHistory')} ${filter === 'approved' ? t('history.approved').toLowerCase() : filter === 'rejected' ? t('history.rejected').toLowerCase() : t('history.pending').toLowerCase()}.`
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-ios-6">
            {Object.entries(groupedByDate).map(([dateKey, dateInspections]) => (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-sm font-semibold mb-ios-3 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  {format(parseInspectionDate(dateInspections[0].date), currentLanguage === 'pt-BR' ? "EEEE, d 'de' MMMM 'de' yyyy" : "EEEE, MMMM d, yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                </h3>
                <div className="space-y-ios-3">
                  <AnimatePresence>
                    {dateInspections.map((insp, index) => (
                      <motion.div
                        key={`${insp.id}-${insp.type}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-ios-4 cursor-pointer group rounded-lg border transition-all"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        onClick={() => {
                          haptics.light();
                          setSelectedInspection(insp);
                        }}
                      >
                        <div className="flex items-start justify-between mb-ios-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-ios-2 mb-ios-1">
                              {getStatusIcon(insp.status)}
                              <span className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>{insp.type}</span>
                            </div>
                            <p className="text-sm mb-ios-1" style={{ color: 'var(--muted-foreground)' }}>
                              Equipamento: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{insp.equipmentId}</span>
                            </p>
                            {insp.inspector && (
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                Inspetor: {insp.inspector}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs mb-ios-1" style={{ color: 'var(--muted-foreground)' }}>
                              {format(parseInspectionDate(insp.date), 'HH:mm', { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                            </p>
                            <span
                              className="text-xs font-medium px-ios-2 py-ios-1 rounded-full"
                              style={{
                                backgroundColor: getStatusColor(insp.status),
                                color: '#000000', // Texto preto para contraste em fundos coloridos
                              }}
                            >
                              {formatStatus(insp.status)}
                            </span>
                          </div>
                        </div>
                        {insp.observations && (
                          <div className="mt-ios-3 pt-ios-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                              {typeof insp.observations === 'string' && insp.observations.length > 100
                                ? insp.observations.substring(0, 100) + '...'
                                : insp.observations}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes da Inspeção */}
      <AnimatePresence>
        {selectedInspection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              haptics.light();
              setSelectedInspection(null);
            }}
            onTouchEnd={(e) => {
              if (e.target === e.currentTarget) {
                haptics.light();
                setSelectedInspection(null);
              }
            }}
            style={{ 
              touchAction: 'manipulation',
              overflow: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300,
                damping: 30,
                duration: 0.3 
              }}
              className="rounded-lg shadow-xl w-full max-w-md m-4 max-h-[90vh] overflow-y-auto"
              style={{ 
                backgroundColor: '#1A1A1A', 
                borderWidth: '1px', 
                borderColor: '#2A2A2A',
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm"
                style={{ 
                  backgroundColor: 'rgba(26, 26, 26, 0.95)',
                  borderColor: '#2A2A2A'
                }}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedInspection.status)}
                  <h2 className="text-xl font-semibold" style={{ color: '#FFFFFF' }}>
                    {t('history.inspectionDetails', { defaultValue: 'Detalhes da Inspeção' })}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setSelectedInspection(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  style={{ color: '#9CA3AF' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Tipo e Equipamento */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                      {t('history.type', { defaultValue: 'Tipo' })}:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                      {selectedInspection.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                      {t('history.equipment', { defaultValue: 'Equipamento' })}:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                      {selectedInspection.equipmentId}
                    </span>
                  </div>
                </div>

                {/* Data e Hora */}
                <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                      {t('history.date', { defaultValue: 'Data' })}:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                      {format(parseInspectionDate(selectedInspection.date), "dd/MM/yyyy", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                      {t('history.time', { defaultValue: 'Hora' })}:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                      {format(parseInspectionDate(selectedInspection.date), "HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                      {t('history.status', { defaultValue: 'Status' })}:
                    </span>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(selectedInspection.status),
                        color: '#000000',
                      }}
                    >
                      {formatStatus(selectedInspection.status)}
                    </span>
                  </div>
                </div>

                {/* Inspetor */}
                {selectedInspection.inspector && (
                  <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
                        {t('history.inspector', { defaultValue: 'Inspetor' })}:
                      </span>
                      <span className="text-sm" style={{ color: '#FFFFFF' }}>
                        {selectedInspection.inspector}
                      </span>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedInspection.observations && (
                  <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                    <div className="space-y-2">
                      <span className="text-sm font-medium block" style={{ color: '#9CA3AF' }}>
                        {t('history.observations', { defaultValue: 'Observações' })}:
                      </span>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#0A0A0A', borderWidth: '1px', borderColor: '#2A2A2A' }}>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#FFFFFF' }}>
                          {typeof selectedInspection.observations === 'string' 
                            ? selectedInspection.observations 
                            : JSON.stringify(selectedInspection.observations, null, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data de Criação */}
                <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {t('history.createdAt', { defaultValue: 'Criado em' })}:
                    </span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {format(parseInspectionDate(selectedInspection.created_at), "dd/MM/yyyy HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-4 border-t" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
                <button
                  onClick={() => {
                    haptics.medium();
                    setSelectedInspection(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg transition-colors active:scale-95"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    fontWeight: '600',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  {t('common.close', { defaultValue: 'Fechar' })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default History;
