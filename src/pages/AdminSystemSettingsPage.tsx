import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import {
  getAllSystemSettings,
  updateSystemSetting,
  SystemSetting,
} from '../utils/systemSettingsOperations';
import {
  Settings,
  Bell,
  Database,
  Shield,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Server,
  Mail,
  Calendar,
} from 'lucide-react';

interface SystemSettings {
  maintenance_mode: boolean;
  max_equipment_per_user: number;
  max_inspections_per_day: number;
  trial_duration_days: number;
  premium_price: number;
  email_notifications_enabled: boolean;
  backup_enabled: boolean;
  backup_frequency_days: number;
  session_timeout_minutes: number;
  require_email_verification: boolean;
  allow_new_registrations: boolean;
}

const AdminSystemSettingsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    max_equipment_per_user: 100,
    max_inspections_per_day: 50,
    trial_duration_days: 14,
    premium_price: 24.90,
    email_notifications_enabled: true,
    backup_enabled: true,
    backup_frequency_days: 7,
    session_timeout_minutes: 60,
    require_email_verification: true,
    allow_new_registrations: true,
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const dbSettings = await getAllSystemSettings();
      
      if (Object.keys(dbSettings).length > 0) {
        setSettings({
          maintenance_mode: dbSettings.maintenance_mode ?? false,
          max_equipment_per_user: dbSettings.max_equipment_per_user ?? 100,
          max_inspections_per_day: dbSettings.max_inspections_per_day ?? 50,
          trial_duration_days: dbSettings.trial_duration_days ?? 14,
          premium_price: dbSettings.premium_price ?? 24.90,
          email_notifications_enabled: dbSettings.email_notifications_enabled ?? true,
          backup_enabled: dbSettings.backup_enabled ?? true,
          backup_frequency_days: dbSettings.backup_frequency_days ?? 7,
          session_timeout_minutes: dbSettings.session_timeout_minutes ?? 60,
          require_email_verification: dbSettings.require_email_verification ?? true,
          allow_new_registrations: dbSettings.allow_new_registrations ?? true,
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError('Falha ao carregar configurações do sistema.');
      // Fallback to localStorage if database fails
      const saved = localStorage.getItem('system_settings');
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          // Use default values if localStorage is invalid
          console.warn('Erro ao carregar configurações do localStorage, usando valores padrão');
        }
      } else {
        // Show helpful message
        setError('Tabela system_settings não encontrada no banco de dados. Execute a migração 20250118000000_create_system_settings_and_security_policies.sql no Supabase SQL Editor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save each setting to the database
      await Promise.all([
        updateSystemSetting('maintenance_mode', settings.maintenance_mode),
        updateSystemSetting('max_equipment_per_user', settings.max_equipment_per_user),
        updateSystemSetting('max_inspections_per_day', settings.max_inspections_per_day),
        updateSystemSetting('trial_duration_days', settings.trial_duration_days),
        updateSystemSetting('premium_price', settings.premium_price),
        updateSystemSetting('email_notifications_enabled', settings.email_notifications_enabled),
        updateSystemSetting('backup_enabled', settings.backup_enabled),
        updateSystemSetting('backup_frequency_days', settings.backup_frequency_days),
        updateSystemSetting('session_timeout_minutes', settings.session_timeout_minutes),
        updateSystemSetting('require_email_verification', settings.require_email_verification),
        updateSystemSetting('allow_new_registrations', settings.allow_new_registrations),
      ]);

      // Also save to localStorage as backup
      localStorage.setItem('system_settings', JSON.stringify(settings));

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar configurações.');
      console.error(err);
      // Fallback to localStorage if database fails
      localStorage.setItem('system_settings', JSON.stringify(settings));
      setSuccess('Configurações salvas localmente (banco de dados indisponível).');
      setTimeout(() => setSuccess(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão?')) {
      return;
    }

    setSettings({
      maintenance_mode: false,
      max_equipment_per_user: 100,
      max_inspections_per_day: 50,
      trial_duration_days: 14,
      premium_price: 24.90,
      email_notifications_enabled: true,
      backup_enabled: true,
      backup_frequency_days: 7,
      session_timeout_minutes: 60,
      require_email_verification: true,
      allow_new_registrations: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Configurações do Sistema" />
      <main className="p-4" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Alerts */}
          {error && (
            <div className="p-4 bg-status-error/20 text-status-error rounded-lg flex items-center gap-2">
              <XCircle size={20} />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-status-success/20 text-status-success rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Modo de Manutenção */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center gap-3 mb-4">
              <Server size={24} className="text-white" />
              <h2 className="text-xl font-bold">Modo de Manutenção</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar Modo de Manutenção</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Desativa o acesso de usuários não-administradores ao sistema
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenance_mode ? 'translate-x-6 bg-status-error' : 'translate-x-1'
                  } peer-checked:bg-status-error`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    settings.maintenance_mode ? 'bg-status-error' : 'bg-gray-300'
                  }`} />
                </label>
              </div>
            </div>
          </div>

          {/* Limites do Sistema */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center gap-3 mb-4">
              <Database size={24} className="text-white" />
              <h2 className="text-xl font-bold">Limites do Sistema</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Máximo de Equipamentos por Usuário
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.max_equipment_per_user}
                  onChange={(e) => setSettings({ ...settings, max_equipment_per_user: parseInt(e.target.value) })}
                  className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Máximo de Inspeções por Dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.max_inspections_per_day}
                  onChange={(e) => setSettings({ ...settings, max_inspections_per_day: parseInt(e.target.value) })}
                  className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duração do Trial (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.trial_duration_days}
                  onChange={(e) => setSettings({ ...settings, trial_duration_days: parseInt(e.target.value) })}
                  className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preço do Plano Premium (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.premium_price}
                  onChange={(e) => setSettings({ ...settings, premium_price: parseFloat(e.target.value) })}
                  className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
            </div>
          </div>

          {/* Configurações de Notificações */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center gap-3 mb-4">
              <Bell size={24} className="text-white" />
              <h2 className="text-xl font-bold">Notificações</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Enviar notificações importantes por email
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    settings.email_notifications_enabled ? 'bg-white' : 'bg-gray-300'
                  }`} />
                </label>
              </div>
            </div>
          </div>

          {/* Configurações de Backup */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center gap-3 mb-4">
              <Database size={24} className="text-white" />
              <h2 className="text-xl font-bold">Backup e Recuperação</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Automático</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Realizar backups automáticos do banco de dados
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backup_enabled}
                    onChange={(e) => setSettings({ ...settings, backup_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.backup_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    settings.backup_enabled ? 'bg-white' : 'bg-gray-300'
                  }`} />
                </label>
              </div>
              {settings.backup_enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Frequência de Backup (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.backup_frequency_days}
                    onChange={(e) => setSettings({ ...settings, backup_frequency_days: parseInt(e.target.value) })}
                    className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Configurações de Segurança */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <div className="flex items-center gap-3 mb-4">
              <Shield size={24} className="text-white" />
              <h2 className="text-xl font-bold">Segurança</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Timeout de Sessão (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
                  className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Requer Verificação de Email</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Usuários devem verificar email antes de usar o sistema
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.require_email_verification}
                    onChange={(e) => setSettings({ ...settings, require_email_verification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.require_email_verification ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    settings.require_email_verification ? 'bg-white' : 'bg-gray-300'
                  }`} />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Permitir Novos Cadastros</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Permitir que novos usuários se registrem no sistema
                  </p>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allow_new_registrations}
                    onChange={(e) => setSettings({ ...settings, allow_new_registrations: e.target.checked })}
                    className="sr-only peer"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allow_new_registrations ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    settings.allow_new_registrations ? 'bg-white' : 'bg-gray-300'
                  }`} />
                </label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 p-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-4 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => navigate('/admin/utilities')}
              className="px-6 py-4 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              Voltar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSystemSettingsPage;

