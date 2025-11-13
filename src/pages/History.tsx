import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { CheckCircle, XCircle, Clock, Calendar, Filter } from 'lucide-react';

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
  const [inspections, setInspections] = useState<InspectionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');

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
        ] = await Promise.all([
          supabase.from('inspecoes_scba').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_multigas').select('*').eq('user_id', user.id).order('data_teste', { ascending: false }),
          supabase.from('inspecoes_camaras_espuma').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_canhoes_monitores').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_chuveiros_lava_olhos').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_alarmes').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
          supabase.from('inspecoes_abrigos').select('*').eq('user_id', user.id).order('data_inspecao', { ascending: false }),
        ]);

        // Processar inspeções SCBA
        if (scbaInspections.data) {
          scbaInspections.data.forEach((insp: any) => {
            allInspections.push({
              id: insp.id,
              type: 'SCBA',
              equipmentId: insp.numero_serie_equipamento,
              date: insp.data_inspecao || insp.created_at,
              status: insp.status_geral || 'pendente',
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
              status: insp.resultado_teste || 'pendente',
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
              status: insp.status_geral || 'pendente',
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
              status: insp.status_geral || 'pendente',
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
              status: insp.status_geral || 'pendente',
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
              status: insp.status_geral || 'pendente',
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
              status: insp.status_geral || 'pendente',
              inspector: insp.inspetor,
              observations: insp.resultados_json ? JSON.stringify(insp.resultados_json) : null,
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
        console.error('Erro ao buscar histórico de inspeções:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [user]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return 'var(--chart-2)'; // Verde
    } else if (statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return 'var(--destructive)'; // Vermelho
    }
    return 'var(--chart-3)'; // Âmbar (pending)
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada')) {
      return <CheckCircle size={20} style={{ color: 'var(--chart-2)' }} />;
    } else if (statusLower.includes('reprovado') || statusLower.includes('reprovada')) {
      return <XCircle size={20} style={{ color: 'var(--destructive)' }} />;
    }
    return <Clock size={20} style={{ color: 'var(--chart-3)' }} />;
  };

  const filteredInspections = inspections.filter((insp) => {
    if (filter === 'all') return true;
    const statusLower = insp.status.toLowerCase();
    if (filter === 'approved') {
      return statusLower.includes('aprovado') || statusLower.includes('ok') || statusLower.includes('aprovada');
    } else if (filter === 'rejected') {
      return statusLower.includes('reprovado') || statusLower.includes('reprovada');
    } else if (filter === 'pending') {
      return !statusLower.includes('aprovado') && !statusLower.includes('reprovado') && !statusLower.includes('ok');
    }
    return true;
  });

  const groupedByDate = filteredInspections.reduce((acc, insp) => {
    const date = new Date(insp.date);
    const dateKey = format(date, 'dd/MM/yyyy', { locale: ptBR });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(insp);
    return acc;
  }, {} as Record<string, InspectionHistory[]>);

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}>
      <PageHeader title="Histórico de Inspeções" />
      <main className="p-ios-4 relative" style={{ backgroundColor: 'transparent' }}>
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mb-ios-6"
        >
          <div className="flex items-center gap-ios-2 mb-ios-4">
            <Filter size={18} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Filtrar por:</span>
          </div>
          <div className="flex gap-ios-2 flex-wrap">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'approved', label: 'Aprovadas' },
              { value: 'rejected', label: 'Reprovadas' },
              { value: 'pending', label: 'Pendentes' },
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
            <p className="text-lg font-semibold mb-ios-2" style={{ color: 'var(--foreground)' }}>Nenhuma inspeção encontrada</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {filter === 'all' 
                ? 'Ainda não há inspeções registradas.'
                : `Nenhuma inspeção ${filter === 'approved' ? 'aprovada' : filter === 'rejected' ? 'reprovada' : 'pendente'} encontrada.`
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
                  {format(new Date(dateInspections[0].date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                        className="p-ios-4 cursor-pointer group rounded-lg border transition-all"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-sm)',
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
                              {format(new Date(insp.date), 'HH:mm', { locale: ptBR })}
                            </p>
                            <span
                              className="text-xs font-medium px-ios-2 py-ios-1 rounded-full"
                              style={{
                                backgroundColor: getStatusColor(insp.status),
                                color: 'var(--card-foreground)',
                              }}
                            >
                              {insp.status}
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
    </div>
  );
};
export default History;
