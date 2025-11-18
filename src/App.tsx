import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Skeleton from './components/Skeleton';

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
const AdminSecurityPoliciesPage = lazy(() => import('./pages/AdminSecurityPoliciesPage'));

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
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
