import { useState, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import {
  getActionLogs,
  getAccessLogs,
  ActionLog,
  AccessLog,
} from '../utils/adminOperations';
import {
  getSecurityAlerts,
  createSecurityAlert,
  resolveSecurityAlert,
  SecurityAlert,
} from '../utils/systemSettingsOperations';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import SimplePieChart from '../components/charts/SimplePieChart';
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Spinner } from '../components/ui/spinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type LogType = 'security' | 'access' | 'audit';
type SecurityEventType = 'failed_login' | 'permission_denied' | 'data_access' | 'suspicious_activity';

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  user_id: string | null;
  ip_address: string | null;
  timestamp: string;
  resolved: boolean;
}

const AdminSecurityAuditPage = () => {
  const { showInfo } = useErrorHandler();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LogType>('security');
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showReports, setShowReports] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados essenciais primeiro, depois logs específicos da tab
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Carregar eventos e alertas em paralelo (dados essenciais)
        await Promise.all([
          loadSecurityEvents(),
          loadSecurityAlerts(),
        ]);
      } catch (err) {
        logger.error('Erro ao carregar dados iniciais', 'admin', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Carregar logs específicos da tab apenas quando necessário
    if (activeTab === 'access') {
      loadAccessLogs();
    } else if (activeTab === 'audit') {
      loadActionLogs();
    }
  }, [activeTab]);

  // Check for critical events and create alerts automatically
  useEffect(() => {
    const checkCriticalEvents = async () => {
      const critical = securityEvents.filter(e => e.severity === 'critical' && !e.resolved);
      if (critical.length > 0 && securityAlerts.length > 0) {
        critical.forEach(event => {
          // Check if alert already exists
          const existingAlert = securityAlerts.find(
            a => a.title === event.description && !a.resolved
          );
          if (!existingAlert) {
            createSecurityAlert(
              'automatic',
              'critical',
              `Evento Crítico: ${event.type}`,
              event.description,
              event.user_id || undefined,
              event.ip_address || undefined,
              'security_event',
              event.id,
              { severity: event.severity }
            ).catch(err => {
              logger.error('Erro ao criar alerta de segurança', 'admin', err);
            });
          }
        });
      }
    };

    if (securityEvents.length > 0 && securityAlerts.length > 0) {
      checkCriticalEvents();
    }
  }, [securityEvents, securityAlerts]);

  const loadSecurityEvents = async () => {
    try {
      // Loading é controlado no useEffect principal
      // Filter failed logins and suspicious activity from access logs
      let logs: AccessLog[] = [];
      try {
        const result = await getAccessLogs(100); // Reduzido de 1000 para 100 para melhor performance
        logs = result.logs;
      } catch (err: any) {
        logger.error('Erro ao carregar logs de acesso', 'adminSecurity', err);
        // Continue with empty logs if table doesn't exist
        if (err.code !== '42P01' && !err.message?.includes('does not exist')) {
          throw err;
        }
      }
      const failedLogins = logs
        .filter(log => !log.success && log.action === 'login')
        .map(log => ({
          id: log.id.toString(),
          type: 'failed_login' as SecurityEventType,
          severity: 'medium' as const,
          description: `Tentativa de login falhou para ${log.user?.email || 'usuário desconhecido'}`,
          user_id: log.user_id,
          ip_address: log.ip_address,
          timestamp: log.created_at,
          resolved: false,
        }));

      // Get permission denied actions from action logs
      let actionLogsData: ActionLog[] = [];
      try {
        const result = await getActionLogs(100); // Reduzido de 1000 para 100 para melhor performance
        actionLogsData = result.logs;
      } catch (err: any) {
        logger.error('Erro ao carregar logs de ação', 'adminSecurity', err);
        // Continue with empty logs if table doesn't exist
        if (err.code !== '42P01' && !err.message?.includes('does not exist')) {
          throw err;
        }
      }
      const permissionDenied = actionLogsData
        .filter(log => log.action_type === 'permission_denied' || log.action_type === 'access_denied')
        .map(log => ({
          id: log.id.toString(),
          type: 'permission_denied' as SecurityEventType,
          severity: 'high' as const,
          description: `Acesso negado: ${log.action_type} em ${log.resource_type || 'recurso'}`,
          user_id: log.user_id,
          ip_address: log.ip_address,
          timestamp: log.created_at,
          resolved: false,
        }));

      setSecurityEvents([...failedLogins, ...permissionDenied].slice(0, 50)); // Limita a 50 eventos iniciais
      setError(null);
    } catch (error: any) {
      logger.error('Erro ao carregar eventos de segurança', 'admin', error);
      setError('Erro ao carregar eventos de segurança. Verifique o console para mais detalhes.');
      setSecurityEvents([]);
    }
    // Loading é controlado no useEffect principal
  };

  const loadActionLogs = async () => {
    try {
      setLoading(true);
      const { logs } = await getActionLogs(50); // Reduzido de 200 para 50
      setActionLogs(logs);
    } catch (error: any) {
      logger.error('Erro ao carregar logs de auditoria', 'admin', error);
      // If table doesn't exist, use empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setActionLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAccessLogs = async () => {
    try {
      setLoading(true);
      const { logs } = await getAccessLogs(50); // Reduzido de 200 para 50
      setAccessLogs(logs);
    } catch (error: any) {
      logger.error('Erro ao carregar logs de acesso', 'admin', error);
      // If table doesn't exist, use empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setAccessLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const { alerts } = await getSecurityAlerts(50, 0); // Reduzido de 100 para 50
      setSecurityAlerts(alerts);
    } catch (error: any) {
      logger.error('Erro ao carregar alertas de segurança', 'admin', error);
      // If table doesn't exist, just use empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setSecurityAlerts([]);
      } else {
        setSecurityAlerts([]);
      }
    }
  };

  const handleExportLogs = () => {
    // TODO: Implement export functionality
    showInfo('Funcionalidade de exportação em desenvolvimento');
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      // Mark event as resolved locally
      setSecurityEvents(events =>
        events.map(e => (e.id === eventId ? { ...e, resolved: true } : e))
      );
      
      // Try to resolve alert in database if it exists
      const alert = securityAlerts.find(a => a.resource_id === eventId && !a.resolved);
      if (alert) {
        await resolveSecurityAlert(alert.id);
        await loadSecurityAlerts();
      }
    } catch (err: any) {
      logger.error('Erro ao resolver evento', 'admin', err);
      // Revert local change on error
      setSecurityEvents(events =>
        events.map(e => (e.id === eventId ? { ...e, resolved: false } : e))
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-status-error bg-status-error/20 border-status-error';
      case 'high':
        return 'text-status-error bg-status-error/20 border-status-error';
      case 'medium':
        return 'text-status-warning bg-status-warning/20 border-status-warning';
      case 'low':
        return 'text-status-info bg-status-info/20 border-status-info';
      default:
        return 'text-light-text-secondary bg-light-surface';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle size={16} className="text-status-error" />;
      case 'medium':
        return <AlertTriangle size={16} className="text-status-warning" />;
      default:
        return <AlertTriangle size={16} className="text-status-info" />;
    }
  };

  const filteredSecurityEvents = securityEvents.filter(event => {
    if (filterSeverity !== 'all' && event.severity !== filterSeverity) return false;
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (searchTerm && !event.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateRange.start && new Date(event.timestamp) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(event.timestamp) > new Date(dateRange.end)) return false;
    return true;
  });

  const unresolvedEvents = securityEvents.filter(e => !e.resolved);
  const criticalEvents = securityEvents.filter(e => e.severity === 'critical' && !e.resolved);

  // Tables exist even if empty - the warning was showing incorrectly
  // We only show warning if there's an actual error loading the data
  const showTableWarning = false; // Tables are created, even if empty

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Segurança e Auditoria" />
      <main className="p-4" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" color="white" />
              <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary">Carregando...</span>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 bg-status-error/20 border-2 border-status-error rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={20} className="text-status-error" />
                <h3 className="font-bold text-status-error">Erro</h3>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadSecurityEvents();
                  loadSecurityAlerts();
                }}
                className="mt-2 px-4 py-2 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Table Warning */}
          {showTableWarning && !loading && !error && (
            <div className="p-4 bg-status-warning/20 border-2 border-status-warning rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-status-warning" />
                <h3 className="font-bold text-status-warning">
                  Tabelas de Logs Não Encontradas
                </h3>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Execute as seguintes migrações no Supabase SQL Editor:
              </p>
              <ul className="list-disc list-inside text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-1 ml-4">
                <li>20250117000000_create_admin_logs_table.sql</li>
                <li>20250118000000_create_system_settings_and_security_policies.sql</li>
              </ul>
            </div>
          )}
          {/* Alertas de Segurança */}
          {criticalEvents.length > 0 && (
            <div className="p-4 bg-status-error/20 border-2 border-status-error rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-status-error" />
                <h3 className="font-bold text-status-error">
                  {criticalEvents.length} Evento(s) Crítico(s) Não Resolvido(s)
                </h3>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Ação imediata recomendada.
              </p>
            </div>
          )}

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-status-error" />
                <span className="text-sm font-medium">Eventos Não Resolvidos</span>
              </div>
              <p className="text-2xl font-bold">{unresolvedEvents.length}</p>
            </div>
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-status-error" />
                <span className="text-sm font-medium">Críticos</span>
              </div>
              <p className="text-2xl font-bold">{criticalEvents.length}</p>
            </div>
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} className="text-white" />
                <span className="text-sm font-medium">Logins Hoje</span>
              </div>
              <p className="text-2xl font-bold">
                {accessLogs.filter(log => log.action === 'login' && log.success && new Date(log.created_at).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={20} className="text-status-warning" />
                <span className="text-sm font-medium">Falhas de Login</span>
              </div>
              <p className="text-2xl font-bold">
                {accessLogs.filter(log => log.action === 'login' && !log.success).length}
              </p>
            </div>
          </div>

          {/* Gráficos e Relatórios */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity size={20} className="text-white" />
                Relatórios de Segurança
              </h3>
              <button
                onClick={() => setShowReports(!showReports)}
                className="px-4 py-2 bg-light-background dark:bg-dark-background border rounded-lg hover:bg-opacity-50 transition-colors text-sm" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
              >
                {showReports ? 'Ocultar' : 'Mostrar'} Relatórios
              </button>
            </div>

            {showReports && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de Barras - Eventos por Severidade */}
                <div>
                  <h4 className="text-sm font-semibold mb-4">Eventos por Severidade</h4>
                  <SimpleBarChart
                    data={[
                      { label: 'Crítico', value: securityEvents.filter(e => e.severity === 'critical').length, color: 'bg-status-error' },
                      { label: 'Alto', value: securityEvents.filter(e => e.severity === 'high').length, color: 'bg-orange-500' },
                      { label: 'Médio', value: securityEvents.filter(e => e.severity === 'medium').length, color: 'bg-status-warning' },
                      { label: 'Baixo', value: securityEvents.filter(e => e.severity === 'low').length, color: 'bg-status-info' },
                    ]}
                    height={150}
                  />
                </div>

                {/* Gráfico de Pizza - Distribuição de Eventos */}
                <div>
                  <h4 className="text-sm font-semibold mb-4">Distribuição de Eventos</h4>
                  <SimplePieChart
                    data={[
                      { label: 'Login Falho', value: securityEvents.filter(e => e.type === 'failed_login').length, color: '#EF4444' },
                      { label: 'Acesso Negado', value: securityEvents.filter(e => e.type === 'permission_denied').length, color: '#F59E0B' },
                      { label: 'Atividade Suspeita', value: securityEvents.filter(e => e.type === 'suspicious_activity').length, color: '#8B5CF6' },
                    ]}
                    size={150}
                  />
                </div>

                {/* Gráfico de Linha - Logins ao Longo do Tempo */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold mb-4">Logins por Dia (Últimos 7 dias)</h4>
                  <SimpleLineChart
                    data={(() => {
                      const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dayStr = format(date, 'dd/MM', { locale: ptBR });
                        const count = accessLogs.filter(log => {
                          const logDate = new Date(log.created_at);
                          return logDate.toDateString() === date.toDateString() && log.action === 'login' && log.success;
                        }).length;
                        return { label: dayStr, value: count };
                      });
                      return last7Days;
                    })()}
                    height={150}
                    color="#10B981"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-2 border-b" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <Shield size={18} className="inline mr-2" />
                Eventos de Segurança
              </button>
              <button
                onClick={() => setActiveTab('access')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'access'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <Activity size={18} className="inline mr-2" />
                Logs de Acesso
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                Auditoria
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
              />
            </div>
            {activeTab === 'security' && (
              <>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  <option value="all">Todas as Severidades</option>
                  <option value="critical">Crítico</option>
                  <option value="high">Alto</option>
                  <option value="medium">Médio</option>
                  <option value="low">Baixo</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="failed_login">Login Falho</option>
                  <option value="permission_denied">Acesso Negado</option>
                  <option value="suspicious_activity">Atividade Suspeita</option>
                </select>
              </>
            )}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                placeholder="Data Início"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                placeholder="Data Fim"
              />
            </div>
            <button
              onClick={() => {
                if (activeTab === 'security') loadSecurityEvents();
                else if (activeTab === 'access') loadAccessLogs();
                else loadActionLogs();
              }}
              className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              <Download size={18} />
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'security' && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="lg" color="white" />
                </div>
              ) : filteredSecurityEvents.length === 0 ? (
                <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
                  Nenhum evento de segurança encontrado.
                </div>
              ) : (
                filteredSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${
                      event.resolved
                        ? 'bg-light-surface/50 dark:bg-dark-surface/50 opacity-60'
                        : getSeverityColor(event.severity)
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(event.severity)}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            event.severity === 'critical' || event.severity === 'high'
                              ? 'bg-status-error/20 text-status-error'
                              : event.severity === 'medium'
                              ? 'bg-status-warning/20 text-status-warning'
                              : 'bg-status-info/20 text-status-info'
                          }`}>
                            {event.severity.toUpperCase()}
                          </span>
                          {event.resolved && (
                            <span className="px-2 py-1 bg-status-success/20 text-status-success rounded-full text-xs font-semibold">
                              Resolvido
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {event.user_id && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {event.user_id.substring(0, 8)}...
                            </span>
                          )}
                          {event.ip_address && (
                            <span className="flex items-center gap-1">
                              <Activity size={14} />
                              {event.ip_address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      {!event.resolved && (
                        <button
                          onClick={() => handleResolveEvent(event.id)}
                          className="px-4 py-2 bg-status-success/20 text-status-success rounded-lg hover:bg-status-success/30 transition-colors text-sm"
                        >
                          Marcar como Resolvido
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'access' && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="lg" color="white" />
                </div>
              ) : accessLogs.length === 0 ? (
                <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
                  Nenhum log de acesso encontrado.
                </div>
              ) : (
                accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {log.success ? (
                            <CheckCircle size={16} className="text-status-success" />
                          ) : (
                            <XCircle size={16} className="text-status-error" />
                          )}
                          <p className="font-medium">
                            {log.user?.full_name || log.user?.email || 'Usuário Desconhecido'}
                          </p>
                          <span className="px-2 py-1 bg-light-background dark:bg-dark-background rounded-full text-xs">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {log.action} {log.ip_address && `• ${log.ip_address}`}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-status-error mt-1">{log.error_message}</p>
                        )}
                      </div>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="lg" color="white" />
                </div>
              ) : actionLogs.length === 0 ? (
                <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
                  Nenhum log de auditoria encontrado.
                </div>
              ) : (
                actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {log.user?.full_name || log.user?.email || 'Sistema'}
                        </p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {log.action_type} {log.resource_type && `em ${log.resource_type}`}
                        </p>
                      </div>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-xs bg-light-background dark:bg-dark-background p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSecurityAuditPage;

