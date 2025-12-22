import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, Info, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'default';
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isLoading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmationModalProps) => {
  
  // Feedback háptico ao abrir modal no Android
  useEffect(() => {
    if (isOpen) {
      try {
        Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        // Haptics pode não estar disponível em todas as plataformas
      }
    }
  }, [isOpen]);

  const handleConfirmWithHaptics = async () => {
    try {
      // Feedback háptico ao confirmar ação crítica
      if (variant === 'danger') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      // Ignore se não disponível
    }
    onConfirm();
  };

  const handleCancelWithHaptics = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Ignore se não disponível
    }
    onClose();
  };
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500',
          buttonBg: 'bg-red-600 hover:bg-red-500 active:bg-red-700',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-500',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700',
        };
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          buttonBg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
        };
      default:
        return {
          icon: HelpCircle,
          iconBg: 'bg-gray-500/10',
          iconColor: 'text-gray-500',
          buttonBg: 'bg-white hover:bg-gray-100 active:bg-gray-200 text-black',
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCancelWithHaptics}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelWithHaptics();
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            // Previne scroll no fundo em Android
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300,
              damping: 30,
              duration: 0.3 
            }}
            className="rounded-lg shadow-xl w-full max-w-sm m-4 p-6"
            style={{ 
              backgroundColor: '#1A1A1A', 
              borderWidth: '1px', 
              borderColor: '#2A2A2A',
              // Melhora performance em Android
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}>
                <Icon className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold leading-6 mb-2" style={{ color: '#FFFFFF' }} id="modal-title">
                  {title}
                </h3>
                <p className="text-sm" style={{ color: '#9CA3AF', whiteSpace: 'pre-line' }}>
                  {message}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                className="w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-inset touch-manipulation min-h-[48px] transition-colors active:scale-95"
                style={{
                  backgroundColor: '#0A0A0A',
                  borderColor: '#2A2A2A',
                  color: '#FFFFFF',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onClick={handleCancelWithHaptics}
                disabled={isLoading}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#1A1A1A')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#0A0A0A')}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] transition-colors active:scale-95 ${styles.buttonBg}`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  color: variant === 'default' ? '#000000' : '#FFFFFF',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onClick={handleConfirmWithHaptics}
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
