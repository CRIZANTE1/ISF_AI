import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useNotifications } from '../hooks/useNotifications';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { exportUserData, downloadUserDataAsJSON, downloadUserDataAsCSV } from '../utils/dataExport';
import { importUserData } from '../utils/dataImport';
import { deleteUserAccount } from '../utils/accountDeletion';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database, 
  Trash2,
  Download,
  Upload,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const SettingsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { handleError, showInfo, showWarning } = useErrorHandler();
  const { 
    permissionStatus, 
    isSupported, 
    isLoading: notificationsLoading,
    requestPermission,
    checkPermission 
  } = useNotifications();
  
  // Inicializar estado do tema baseado na classe atual do documento
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Estado de notificações baseado na permissão
  const notifications = permissionStatus.granted;

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const toggleNotifications = async () => {
    if (permissionStatus.granted) {
      // Se já tem permissão, apenas atualiza o estado local
      // (não podemos desabilitar permissões programaticamente)
      showInfo('Para desativar notificações, acesse as configurações do navegador/dispositivo.');
      return;
    }

    if (permissionStatus.denied) {
      showWarning('As notificações foram bloqueadas. Para ativá-las, acesse as configurações do navegador/dispositivo e permita notificações para este site/app.');
      return;
    }

    // Solicita permissão
    const granted = await requestPermission();
    if (granted) {
      // Salva preferência no localStorage
      localStorage.setItem('notifications_enabled', 'true');
      showInfo('Notificações ativadas com sucesso!');
    } else {
      showWarning('Permissão de notificações negada. Você pode ativá-las nas configurações do navegador/dispositivo.');
    }
    
    // Atualiza o status da permissão
    await checkPermission();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportData = async () => {
    if (!user) {
      showWarning('Você precisa estar autenticado para exportar dados.');
      return;
    }

    setExporting(true);
    try {
      const data = await exportUserData(user);
      
      // Perguntar formato
      const format = confirm('Deseja exportar em JSON (completo) ou CSV (apenas equipamentos)?\n\nOK = JSON\nCancelar = CSV');
      
      if (format) {
        downloadUserDataAsJSON(data);
        showInfo('Dados exportados em JSON com sucesso!');
      } else {
        downloadUserDataAsCSV(data);
        showInfo('Equipamentos exportados em CSV com sucesso!');
      }
    } catch (error) {
      handleError(error, 'storage', 'Falha ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    if (!user) {
      showWarning('Você precisa estar autenticado para importar dados.');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const result = await importUserData(user, file);
      
      if (result.success) {
        showInfo(result.message);
        // Recarregar página para atualizar dados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showWarning(result.message);
      }
    } catch (error) {
      handleError(error, 'storage', 'Falha ao importar dados');
    } finally {
      setImporting(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      showWarning('Você precisa estar autenticado para excluir a conta.');
      return;
    }

    if (deleteConfirmation !== 'DELETAR') {
      showWarning('Digite "DELETAR" para confirmar a exclusão da conta.');
      return;
    }

    if (!confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os seus dados serão permanentemente excluídos:\n- Equipamentos\n- Inspeções\n- Histórico\n- Configurações\n\nTem certeza que deseja continuar?')) {
      return;
    }

    // Confirmação final
    if (!confirm('Esta é sua última chance de cancelar. Todos os seus dados serão PERMANENTEMENTE excluídos. Deseja realmente continuar?')) {
      return;
    }

    try {
      const result = await deleteUserAccount(user, deleteConfirmation);
      
      if (result.success) {
        showInfo(result.message);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          window.location.href = '/#/auth';
        }, 3000);
      } else {
        showWarning(result.message);
      }
    } catch (error) {
      handleError(error, 'profile', 'Falha ao excluir conta. Entre em contato com o suporte.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Configurações" />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md mx-auto space-y-6">
          {/* Preferências de Aparência */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Preferências
            </h3>
            
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon size={20} color="#FFFFFF" />
                  ) : (
                    <Sun size={20} color="#FFFFFF" />
                  )}
                  <div>
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Alternar entre tema claro e escuro
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-white' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notificações */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} color="#FFFFFF" />
                  <div>
                    <p className="font-medium">Notificações</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {!isSupported 
                        ? 'Notificações não suportadas neste dispositivo'
                        : permissionStatus.granted
                        ? 'Recebendo alertas e notificações'
                        : permissionStatus.denied
                        ? 'Notificações bloqueadas - ative nas configurações'
                        : 'Receber alertas e notificações'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleNotifications}
                  disabled={!isSupported || notificationsLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-white' : 'bg-gray-300'
                  } ${(!isSupported || notificationsLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield size={20} />
              Segurança
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => showInfo('Funcionalidade em desenvolvimento')}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Lock size={18} />
                <span>Alterar Senha</span>
              </button>
              <button
                onClick={() => showInfo('Funcionalidade em desenvolvimento')}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Eye size={18} />
                <span>Histórico de Sessões</span>
              </button>
            </div>
          </div>

          {/* Dados */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database size={20} />
              Dados
            </h3>
            
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                <span>{exporting ? 'Exportando...' : 'Exportar Meus Dados'}</span>
              </button>
              <button
                onClick={handleImportData}
                disabled={importing}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                <span>{importing ? 'Importando...' : 'Importar Dados'}</span>
              </button>
            </div>
          </div>

          {/* Zona Perigosa */}
          <div className="p-4 bg-status-error/10 border-2 border-status-error rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-status-error flex items-center gap-2">
              <Trash2 size={20} />
              Zona Perigosa
            </h3>
            
            {!showDeleteAccount ? (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full p-3 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                Excluir Minha Conta
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-status-error">
                  ⚠️ Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                </p>
                <input
                  type="text"
                  placeholder='Digite "DELETAR" para confirmar'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-status-error rounded-lg focus:ring-2 focus:ring-status-error focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETAR'}
                    className="flex-1 p-3 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteAccount(false);
                      setDeleteConfirmation('');
                    }}
                    className="flex-1 p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Voltar */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
          >
            Voltar ao Perfil
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

