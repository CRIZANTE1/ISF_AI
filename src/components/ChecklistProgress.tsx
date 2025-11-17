/**
 * Componente de indicador de progresso do checklist
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ChecklistProgressProps {
  total: number;
  answered: number;
  nonConformities: number;
}

const ChecklistProgress = ({ total, answered, nonConformities }: ChecklistProgressProps) => {
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const percentage = Math.round(progress);

  return (
    <motion.div
      className="mb-6 p-4 rounded-lg border"
      style={{
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
            Progresso do Checklist
          </span>
          {nonConformities > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20"
            >
              <AlertCircle className="w-3 h-3" style={{ color: '#EF4444' }} />
              <span className="text-xs font-medium" style={{ color: '#EF4444' }}>
                {nonConformities} não {nonConformities === 1 ? 'conformidade' : 'conformidades'}
              </span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
          <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
            {answered} de {total} respondidas
          </span>
        </div>
      </div>

      {/* Barra de progresso principal */}
      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: nonConformities > 0
              ? 'linear-gradient(90deg, #10B981 0%, #EF4444 100%)'
              : '#10B981',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Indicador de porcentagem */}
        {progress > 10 && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: '#FFFFFF' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {percentage}%
          </motion.span>
        )}
      </div>

      {/* Estatísticas adicionais */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span style={{ color: '#9CA3AF' }}>
            {answered - nonConformities} conforme{answered - nonConformities !== 1 ? 's' : ''}
          </span>
        </div>
        {nonConformities > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span style={{ color: '#EF4444' }}>
              {nonConformities} não conforme{nonConformities !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span style={{ color: '#9CA3AF' }}>
            {total - answered} pendente{total - answered !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChecklistProgress;

