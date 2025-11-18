import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean;
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
          style={{ touchAction: 'manipulation' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ 
              type: 'tween', 
              ease: [0.4, 0, 0.2, 1], 
              duration: 0.25 
            }}
            className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-sm m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-status-error/10 sm:mx-0">
                <AlertTriangle className="h-6 w-6 text-status-error" aria-hidden="true" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold leading-6 text-light-text-primary dark:text-dark-text-primary" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                className="w-full justify-center rounded-md bg-light-surface dark:bg-dark-surface px-4 py-3 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary shadow-sm ring-1 ring-inset ring-light-border dark:ring-dark-border hover:bg-gray-50 dark:hover:bg-dark-background active:bg-gray-100 dark:active:bg-dark-background sm:w-auto touch-manipulation min-h-[44px]"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="w-full justify-center rounded-md bg-status-error px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500 active:bg-red-600 sm:w-auto disabled:bg-red-400 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                onClick={onConfirm}
                disabled={isLoading}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
