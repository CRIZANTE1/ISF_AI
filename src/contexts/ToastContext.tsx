import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration || 7000); // Errors stay longer
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '400px' }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual Toast Item
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: 'rgba(52, 199, 89, 0.95)',
          borderColor: 'rgba(52, 199, 89, 0.3)',
          icon: '✓',
        };
      case 'error':
        return {
          backgroundColor: 'rgba(255, 59, 48, 0.95)',
          borderColor: 'rgba(255, 59, 48, 0.3)',
          icon: '✕',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(255, 149, 0, 0.95)',
          borderColor: 'rgba(255, 149, 0, 0.3)',
          icon: '⚠',
        };
      case 'info':
      default:
        return {
          backgroundColor: 'rgba(0, 200, 255, 0.95)',
          borderColor: 'rgba(0, 200, 255, 0.3)',
          icon: 'ℹ',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-auto"
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: '1px',
        borderRadius: '12px',
        padding: '12px 16px',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-white text-lg font-bold flex-shrink-0" style={{ lineHeight: '1.2' }}>
          {styles.icon}
        </span>
        <p className="text-white text-sm font-medium flex-1" style={{ lineHeight: '1.4' }}>
          {toast.message}
        </p>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          style={{ fontSize: '18px', lineHeight: '1' }}
          aria-label="Fechar notificação"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

