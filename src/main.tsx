import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx';
import { EquipmentCacheProvider } from './contexts/EquipmentCacheContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';

// Verificar preferência do usuário e aplicar tema
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  // Por padrão, usar tema claro se não houver preferência salva
  return false;
};

const isDark = getInitialTheme();
if (isDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
  // Garantir que o tema claro seja aplicado
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'light');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EquipmentCacheProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </EquipmentCacheProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
