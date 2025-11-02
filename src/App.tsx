import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';
import Profile from './pages/Profile';
import History from './pages/History';
import Utilities from './pages/Utilities';
import AuthPage from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import EquipmentListPage from './pages/EquipmentListPage';
import AddEquipmentPage from './pages/AddEquipmentPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import AddInspectionPage from './pages/AddInspectionPage';
import EditEquipmentPage from './pages/EditEquipmentPage';
import MyDataPage from './pages/MyDataPage';
import PlanPaymentPage from './pages/PlanPaymentPage';
import SettingsPage from './pages/SettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inspections" element={<Inspections />} />
        <Route path="inspections/:type" element={<EquipmentListPage />} />
        <Route path="inspections/:type/new" element={<AddEquipmentPage />} />
        <Route path="equipment/:type/:id" element={<EquipmentDetailPage />} />
        <Route path="equipment/:type/:id/edit" element={<EditEquipmentPage />} />
        <Route path="equipment/:type/:id/inspections/new" element={<AddInspectionPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/my-data" element={<MyDataPage />} />
        <Route path="profile/plan-payment" element={<PlanPaymentPage />} />
        <Route path="profile/settings" element={<SettingsPage />} />
        <Route path="history" element={<History />} />
        <Route 
          path="utilities" 
          element={
            <AdminRoute>
              <Utilities />
            </AdminRoute>
          } 
        />
        <Route 
          path="utilities/users" 
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
