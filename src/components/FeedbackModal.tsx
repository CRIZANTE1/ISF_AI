import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { logger } from '../utils/logger';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackFormData {
  type: 'feedback' | 'suggestion';
  message: string;
}

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { executeWithFeedback } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FeedbackFormData>({
    defaultValues: {
      type: 'feedback',
      message: '',
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    const success = await executeWithFeedback(
      async () => {
        const { error } = await supabase
          .from('user_feedback')
          .insert({
            user_id: user.id,
            type: data.type,
            message: data.message.trim(),
            created_at: new Date().toISOString(),
          });

        if (error) {
          // Se a tabela não existir, loga o erro mas não bloqueia
          logger.error('Erro ao salvar feedback', 'feedback', error);
          throw error;
        }

        return true;
      },
      'feedback',
      t('feedback.success'),
      t('feedback.error')
    );

    if (success) {
      reset();
      setTimeout(() => {
        onClose();
      }, 1500);
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          style={{ 
            touchAction: 'manipulation',
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
            className="rounded-lg shadow-xl w-full max-w-md m-4 p-6"
            style={{ 
              backgroundColor: '#1A1A1A', 
              borderWidth: '1px', 
              borderColor: '#2A2A2A',
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(114, 222, 255, 0.2)' }}>
                  <MessageSquare size={20} color="#72DEFF" />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('feedback.title')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                style={{ color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Tipo de Feedback */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  {t('feedback.type')}
                </label>
                <div className="flex gap-3">
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="feedback"
                      {...register('type', { required: true })}
                      className="hidden"
                    />
                    <div 
                      className="p-3 rounded-lg border cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: selectedType === 'feedback' ? 'rgba(114, 222, 255, 0.2)' : 'var(--surface-current)', 
                        borderColor: selectedType === 'feedback' ? '#72DEFF' : 'var(--border-current)'
                      }}
                    >
                      <div className="text-sm font-medium text-center" style={{ color: '#FFFFFF' }}>
                        {t('feedback.feedbackType')}
                      </div>
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="suggestion"
                      {...register('type', { required: true })}
                      className="hidden"
                    />
                    <div 
                      className="p-3 rounded-lg border cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: selectedType === 'suggestion' ? 'rgba(114, 222, 255, 0.2)' : 'var(--surface-current)', 
                        borderColor: selectedType === 'suggestion' ? '#72DEFF' : 'var(--border-current)'
                      }}
                    >
                      <div className="text-sm font-medium text-center" style={{ color: '#FFFFFF' }}>
                        {t('feedback.suggestionType')}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  {t('feedback.message')} <span className="text-xs" style={{ color: '#9CA3AF' }}>({t('equipment.formHints.required')})</span>
                </label>
                <textarea
                  id="message"
                  {...register('message', { 
                    required: t('feedback.messageRequired'),
                    minLength: {
                      value: 10,
                      message: t('feedback.messageMinLength')
                    }
                  })}
                  rows={6}
                  className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-rally-blue/30 focus:outline-none resize-none"
                  style={{ 
                    backgroundColor: 'var(--surface-current)', 
                    borderColor: errors.message ? '#DC2626' : 'var(--border-current)',
                    color: '#FFFFFF'
                  }}
                  placeholder={t('feedback.messagePlaceholder')}
                />
                {errors.message && (
                  <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg border transition-colors hover:opacity-80 disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--surface-current)', 
                    borderColor: 'var(--border-current)',
                    color: '#FFFFFF'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#72DEFF', color: '#000000' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('feedback.sending')}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {t('feedback.send')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;

