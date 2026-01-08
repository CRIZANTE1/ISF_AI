import { Routes, Route, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Skeleton from './components/Skeleton';
import { setNotificationNavigationCallback, notificationService } from './services/notificationService';
import { backgroundSyncService } from './services/backgroundSyncService';
import { logger } from './utils/logger';

// Lazy loading de rotas públicas (carregamento sob demanda)
const AuthPage = lazy(() => import('./pages/Auth'));

// Lazy loading de rotas principais
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inspections = lazy(() => import('./pages/Inspections'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage'));
const Utilities = lazy(() => import('./pages/Utilities'));
const EquipmentListPage = lazy(() => import('./pages/EquipmentListPage'));
const AddEquipmentPage = lazy(() => import('./pages/AddEquipmentPage'));
const EquipmentDetailPage = lazy(() => import('./pages/EquipmentDetailPage'));
const AddInspectionPage = lazy(() => import('./pages/AddInspectionPage'));
const EditEquipmentPage = lazy(() => import('./pages/EditEquipmentPage'));
const MyDataPage = lazy(() => import('./pages/MyDataPage'));
const PlanPaymentPage = lazy(() => import('./pages/PlanPaymentPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EquipmentMap = lazy(() => import('./pages/EquipmentMap'));
const QrInspectionPage = lazy(() => import('./pages/QrInspectionPage'));
const QrGeneratorPage = lazy(() => import('./pages/QrGeneratorPage'));

// Lazy loading de rotas admin (raramente acessadas)
const AdminUtilities = lazy(() => import('./pages/AdminUtilities'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminSystemSettingsPage = lazy(() => import('./pages/AdminSystemSettingsPage'));
const AdminSecurityAuditPage = lazy(() => import('./pages/AdminSecurityAuditPage'));
const AdminCustomEquipmentPage = lazy(() => import('./pages/AdminCustomEquipmentPage'));
const CustomEquipmentTypesPage = lazy(() => import('./pages/CustomEquipmentTypesPage'));
const AdminSecurityPoliciesPage = lazy(() => import('./pages/AdminSecurityPoliciesPage'));
const LicenseManagement = lazy(() => import('./pages/LicenseManagement'));
const ActivateLicense = lazy(() => import('./pages/ActivateLicense'));
const LogManagementPage = lazy(() => import('./pages/LogManagementPage'));

/**
 * Componente de loading para Suspense
 */
const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={<Skeleton fullScreen />}
  >
    {children}
  </Suspense>
);

function App() {
  const navigate = useNavigate();

  // Configurar callback de navegação para notificações e deep links
  useEffect(() => {
    setNotificationNavigationCallback((url: string) => {
      // Extrai o path da URL se for uma URL completa
      const path = url.startsWith('http') ? new URL(url).pathname : url;
      navigate(path);
    });

    // Listener para Deep Links (global)
    // Isso garante que links como reset de senha funcionem mesmo se o usuário já estiver logado ou em outra tela
    const setupDeepLinks = async () => {
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
      if (!isCapacitor) return;

      CapacitorApp.addListener('appUrlOpen', (data) => {
        logger.info('[App] Deep link recebido globalmente', 'app', { url: data.url });

        // Verificar se é reset de senha
        if (data.url.includes('reset-password')) {
          logger.info('[App] Link de reset de senha detectado, navegando para Auth', 'app');
          // Forçar navegação para Auth, passando a URL no state
          navigate('/auth', { state: { deepLink: data.url } });
        }
      });
    };

    setupDeepLinks();

    // Registrar tipos de ação para notificações locais
    notificationService.registerActionTypes();

    // Verifica se há operações pendentes e inicia o serviço se necessário
    backgroundSyncService.checkAndStartIfNeeded().catch((error) => {
      logger.error('Erro ao verificar sincronização em background', 'app', error);
    });

    // Limpar ao desmontar
    return () => {
      backgroundSyncService.stop();
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/auth" 
          element={
            <PageSuspense>
              <AuthPage />
            </PageSuspense>
          } 
        />
        <Route 
          path="/activate-license" 
          element={
            <PageSuspense>
              <ActivateLicense />
            </PageSuspense>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route 
            index 
            element={
              <PageSuspense>
                <Dashboard />
              </PageSuspense>
            } 
          />
          <Route 
            path="inspections" 
            element={
              <PageSuspense>
                <Inspections />
              </PageSuspense>
            } 
          />
          <Route 
            path="inspections/:type" 
            element={
              <PageSuspense>
                <EquipmentListPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="inspections/:type/qr" 
            element={
              <PageSuspense>
                <QrInspectionPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="inspections/:type/new" 
            element={
              <PageSuspense>
                <AddEquipmentPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="equipment/:type/:id" 
            element={
              <PageSuspense>
                <EquipmentDetailPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="equipment/:type/:id/edit" 
            element={
              <PageSuspense>
                <EditEquipmentPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="equipment/:type/:id/inspections/new" 
            element={
              <PageSuspense>
                <AddInspectionPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="profile" 
            element={
              <PageSuspense>
                <Profile />
              </PageSuspense>
            } 
          />
          <Route 
            path="profile/my-data" 
            element={
              <PageSuspense>
                <MyDataPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="profile/plan-payment" 
            element={
              <PageSuspense>
                <PlanPaymentPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="profile/settings" 
            element={
              <PageSuspense>
                <SettingsPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="history" 
            element={
              <PageSuspense>
                <History />
              </PageSuspense>
            } 
          />
          <Route 
            path="action-plans" 
            element={
              <PageSuspense>
                <ActionPlansPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="map" 
            element={
              <PageSuspense>
                <EquipmentMap />
              </PageSuspense>
            } 
          />
          <Route 
            path="utilities" 
            element={
              <PageSuspense>
                <Utilities />
              </PageSuspense>
            } 
          />
          <Route 
            path="utilities/qr-generator" 
            element={
              <PageSuspense>
                <QrGeneratorPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="utilities/custom-equipment" 
            element={
              <PageSuspense>
                <CustomEquipmentTypesPage />
              </PageSuspense>
            } 
          />
          <Route 
            path="admin/utilities" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminUtilities />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/users" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminUsersPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/system-settings" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminSystemSettingsPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/security-audit"
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminSecurityAuditPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/security-policies" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminSecurityPoliciesPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/log-management" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <LogManagementPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/licenses" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <LicenseManagement />
                </PageSuspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="admin/utilities/custom-equipment" 
            element={
              <AdminRoute>
                <PageSuspense>
                  <AdminCustomEquipmentPage />
                </PageSuspense>
              </AdminRoute>
            } 
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
