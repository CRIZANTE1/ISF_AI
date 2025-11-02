import Skeleton from './Skeleton';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, Package } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
  percentage?: number;
  color?: 'orange' | 'green' | 'blue' | 'purple';
}

const MetricCard = ({ title, value, isLoading, percentage, color = 'orange' }: MetricCardProps) => {
  const colorConfig = {
    orange: {
      text: 'text-brand-orange',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      stroke: '#FF9500',
      icon: Package,
      gradient: 'from-orange-400 to-orange-600',
    },
    green: {
      text: 'text-status-success',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      stroke: '#34C759',
      icon: CheckCircle2,
      gradient: 'from-green-400 to-green-600',
    },
    blue: {
      text: 'text-brand-blue',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      stroke: '#5AC8FA',
      icon: Clock,
      gradient: 'from-blue-400 to-blue-600',
    },
    purple: {
      text: 'text-brand-purple',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      stroke: '#AF52DE',
      icon: Activity,
      gradient: 'from-purple-400 to-purple-600',
    },
  };

  const config = colorConfig[color];
  const Icon = config.icon;

  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage || (value ? Math.min((value / 100) * 100, 100) : 0);
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${config.bg} rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg border ${config.border} transition-colors duration-200`}
      >
        <Skeleton className="h-20 w-20 rounded-full mb-3" />
        <Skeleton className="h-4 w-16" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`${config.bg} rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg border ${config.border} transition-all duration-200 cursor-pointer group`}
    >
      <div className="relative w-24 h-24 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
        </motion.div>
        <svg className="transform -rotate-90 w-24 h-24 absolute inset-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color === 'orange' ? '#FFE5CC' : color === 'green' ? '#CCF5D6' : color === 'blue' ? '#CCEBFF' : '#F0CCFF'}
            className="dark:opacity-30"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className={`text-2xl font-bold ${config.text}`}>
              {percentage !== undefined ? `${Math.round(percentage)}%` : value ?? '-'}
            </span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Icon className={`${config.text} w-5 h-5 opacity-70`} />
            </motion.div>
          </div>
        </div>
      </div>
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`text-sm font-semibold ${config.text} uppercase tracking-wide`}
      >
        {title}
      </motion.span>
    </motion.div>
  );
};

export default MetricCard;
