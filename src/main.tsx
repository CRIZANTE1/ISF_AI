import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx';
import { EquipmentCacheProvider } from './contexts/EquipmentCacheContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';

// Verificar preferência do usuário e aplicar tema de forma segura
const getInitialTheme = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
    }
  } catch (error) {
    console.warn('Erro ao acessar localStorage:', error);
  }
  // Por padrão, usar tema claro se não houver preferência salva
  return false;
};

// Aplicar tema de forma segura
try {
  if (typeof document !== 'undefined') {
    const isDark = getInitialTheme();
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      // Garantir que o tema claro seja aplicado
      try {
        if (typeof window !== 'undefined' && window.localStorage && !localStorage.getItem('theme')) {
          localStorage.setItem('theme', 'light');
        }
      } catch (error) {
        console.warn('Erro ao salvar tema no localStorage:', error);
      }
    }
  }
} catch (error) {
  console.warn('Erro ao aplicar tema inicial:', error);
}

// Verificar se o elemento root existe antes de renderizar
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado no DOM');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <EquipmentCacheProvider>
          <ToastProvider>
          <App />
          </ToastProvider>
        </EquipmentCacheProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
