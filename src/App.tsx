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
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<History />} />
        <Route 
          path="utilities" 
          element={
            <AdminRoute>
              <Utilities />
            </AdminRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
