import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Save, AlertCircle, CheckCircle, Database, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  getLogRetentionConfig,
  updateLogRetentionConfig,
  cleanupOldLogs,
  type LogRetentionConfig,
} from '../utils/adminOperations';
import { logger } from '../utils/logger';

const LogManagementPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useErrorHandler();
  const { isOpen, confirmData, isLoading: confirmLoading, showConfirm, handleConfirm, handleCancel } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [config, setConfig] = useState<LogRetentionConfig | null>(null);
  const [actionLogsDays, setActionLogsDays] = useState(365);
  const [accessLogsDays, setAccessLogsDays] = useState(365);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getLogRetentionConfig();
      if (data) {
        setConfig(data);
        setActionLogsDays(data.action_logs_retention_days);
        setAccessLogsDays(data.access_logs_retention_days);
      }
    } catch (error) {
      logger.error('Failed to load log retention config', 'admin', error);
      showError('Erro ao carregar configuração de retenção de logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (actionLogsDays < 30 || accessLogsDays < 30) {
      showError('O período mínimo de retenção é de 30 dias');
      return;
    }

    if (actionLogsDays > 3650 || accessLogsDays > 3650) {
      showError('O período máximo de retenção é de 10 anos (3650 dias)');
      return;
    }

    setSaving(true);
    try {
      await updateLogRetentionConfig(actionLogsDays, accessLogsDays);
      showSuccess('Configuração atualizada com sucesso!');
      await loadConfig();
    } catch (error) {
      logger.error('Failed to update log retention config', 'admin', error);
      showError('Erro ao atualizar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    const confirmed = await showConfirm({
      title: 'Confirmar Limpeza',
      message: 'Tem certeza que deseja limpar logs antigos? Esta ação não pode ser desfeita.',
      confirmText: 'Limpar Logs',
      cancelText: 'Cancelar',
      variant: 'warning'
    });

    if (!confirmed) return;

    setCleaning(true);
    try {
      const result = await cleanupOldLogs();
      if (result) {
        showSuccess(
          `Limpeza concluída! ${result.deleted_action_logs} logs de ações e ${result.deleted_access_logs} logs de acesso foram removidos.`
        );
        await loadConfig();
      } else {
        showError('Nenhum log antigo foi encontrado para limpar');
      }
    } catch (error) {
      logger.error('Failed to cleanup logs', 'admin', error);
      showError('Erro ao limpar logs');
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title={{ key: 'admin.logManagement', defaultValue: 'Gerenciamento de Logs' }} />
        <main className="p-4">
          <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
            Carregando...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'admin.logManagement', defaultValue: 'Gerenciamento de Logs' }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Info Card */}
          <div
            className="p-4 rounded-lg border flex items-start gap-3"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
          >
            <AlertCircle size={20} style={{ color: '#60A5FA', marginTop: '2px' }} />
            <div style={{ color: '#E5E7EB' }}>
              <p className="text-sm">
                Configure o período de retenção dos logs de sistema. Logs mais antigos que o período configurado
                serão automaticamente removidos durante a limpeza.
              </p>
            </div>
          </div>

          {/* Última Limpeza */}
          {config?.last_cleanup_at && (
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} style={{ color: '#10B981' }} />
                <span className="font-semibold" style={{ color: '#FFFFFF' }}>
                  Última Limpeza
                </span>
              </div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {formatDate(config.last_cleanup_at)}
              </p>
            </div>
          )}

          {/* Configuração de Retenção */}
          <div
            className="p-6 rounded-lg border space-y-6"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
          >
            <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
              Configuração de Retenção
            </h2>

            <div className="space-y-4">
              {/* Logs de Ações */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Logs de Ações do Usuário (dias)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="30"
                    max="3650"
                    value={actionLogsDays}
                    onChange={(e) => setActionLogsDays(parseInt(e.target.value) || 30)}
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: '#0A0A0A',
                      borderColor: '#2A2A2A',
                      color: '#FFFFFF',
                    }}
                  />
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>
                    {Math.floor(actionLogsDays / 365)} anos
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Mínimo: 30 dias | Máximo: 3650 dias (10 anos)
                </p>
              </div>

              {/* Logs de Acesso */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  Logs de Acesso (Login/Logout) (dias)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="30"
                    max="3650"
                    value={accessLogsDays}
                    onChange={(e) => setAccessLogsDays(parseInt(e.target.value) || 30)}
                    className="flex-1 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: '#0A0A0A',
                      borderColor: '#2A2A2A',
                      color: '#FFFFFF',
                    }}
                  />
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>
                    {Math.floor(accessLogsDays / 365)} anos
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Mínimo: 30 dias | Máximo: 3650 dias (10 anos)
                </p>
              </div>
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>

          {/* Limpeza Manual */}
          <div
            className="p-6 rounded-lg border space-y-4"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
          >
            <div className="flex items-center gap-2">
              <Database size={20} style={{ color: '#EF4444' }} />
              <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                Limpeza Manual de Logs
              </h2>
            </div>

            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Execute uma limpeza manual para remover logs antigos de acordo com a política de retenção configurada.
              Esta ação remove permanentemente logs mais antigos que o período configurado.
            </p>

            <div
              className="p-3 rounded-lg border flex items-start gap-2"
              style={{ backgroundColor: '#0A0A0A', borderColor: '#374151' }}
            >
              <AlertCircle size={16} style={{ color: '#F59E0B', marginTop: '2px' }} />
              <p className="text-xs" style={{ color: '#D1D5DB' }}>
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. Logs removidos não poderão ser
                recuperados.
              </p>
            </div>

            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#991B1B',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                if (!cleaning) e.currentTarget.style.backgroundColor = '#7F1D1D';
              }}
              onMouseLeave={(e) => {
                if (!cleaning) e.currentTarget.style.backgroundColor = '#991B1B';
              }}
            >
              <Trash2 size={18} />
              {cleaning ? 'Limpando...' : 'Executar Limpeza Manual'}
            </button>
          </div>

          {/* Informações Adicionais */}
          <div
            className="p-4 rounded-lg border"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} style={{ color: '#10B981' }} />
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>
                Automação (Futuro)
              </span>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              A limpeza automática pode ser configurada usando pg_cron ou Edge Functions agendadas do Supabase.
              Por enquanto, a limpeza deve ser executada manualmente quando necessário.
            </p>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação */}
      {confirmData && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={confirmData.title}
          message={confirmData.message}
          isLoading={confirmLoading}
          confirmText={confirmData.confirmText}
          cancelText={confirmData.cancelText}
          variant={confirmData.variant}
        />
      )}
    </div>
  );
};

export default LogManagementPage;

