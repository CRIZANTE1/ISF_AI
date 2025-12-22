import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, HelpCircle, X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useTranslation } from '../hooks/useTranslation';

interface HelpTipProps {
  content?: React.ReactNode;
  title?: string;
  contentKey?: string;
  titleKey?: string;
  icon?: 'lightbulb' | 'question';
  className?: string;
  triggerClassName?: string;
}

const HelpTip = ({
  content,
  title,
  contentKey,
  titleKey,
  icon = 'question',
  className = '',
  triggerClassName = ''
}: HelpTipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore
    }
    setIsOpen(true);
    // Previne scroll do body quando modal está aberto
    document.body.style.overflow = 'hidden';
  };

  const handleClose = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore
    }
    setIsOpen(false);
    // Restaura scroll do body
    document.body.style.overflow = '';
  };

  // Fecha ao pressionar ESC
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const Icon = icon === 'lightbulb' ? Lightbulb : HelpCircle;
  
  const displayTitle = titleKey ? t(titleKey) : (title || t('common.tip', { defaultValue: 'Dica' }));
  const displayContent = contentKey ? t(contentKey) : content;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={handleClose}
          onTouchStart={(e) => {
            // Fecha ao tocar no overlay (fora do modal)
            if (e.target === e.currentTarget) {
              handleClose(e);
            }
          }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)', // Transparência forçada
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            touchAction: 'manipulation'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#1C1C1E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '85vh',
              position: 'relative',
              zIndex: 1000000
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <Icon className="text-red-500" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white truncate">
                  {displayTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - com mais espaço e melhor formatação */}
            <div 
              className="p-6 overflow-y-auto flex-1"
              style={{
                color: '#E5E5E7',
                fontSize: '15px',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word'
              }}
            >
              {displayContent}
            </div>

            {/* Footer */}
            <div className="p-5 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(44, 44, 46, 0.5)' }}>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
                style={{ fontSize: '16px' }}
              >
                {t('common.close', { defaultValue: 'Entendi' })}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`p-1 rounded-full transition-colors hover:bg-white/10 ${triggerClassName} ${className}`}
        style={{ color: '#EF4444' }}
        aria-label="Ver dica"
      >
        <Icon size={20} />
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
};

export default HelpTip;

