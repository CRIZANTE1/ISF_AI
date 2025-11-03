import Skeleton from './Skeleton';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
  percentage?: number;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

const MetricCard = ({ title, value, isLoading, percentage, color = 'blue' }: MetricCardProps) => {
  const colorConfig = {
    blue: { 
      bg: 'rgba(21, 126, 251, 0.4)',          // Fitness Stand translúcido (40%)
      bgSolid: '#157EFB',                     // Cor sólida para texto
      text: '#FFFFFF',
      accent: '#0066CC',
      shadow: 'rgba(21, 126, 251, 0.3)'
    },
    green: { 
      bg: 'rgba(83, 215, 105, 0.4)',         // Fitness Exercise translúcido (40%)
      bgSolid: '#53D769',
      text: '#FFFFFF',
      accent: '#45C159',
      shadow: 'rgba(83, 215, 105, 0.3)'
    },
    orange: { 
      bg: 'rgba(252, 61, 57, 0.4)',          // Fitness Move translúcido (40%)
      bgSolid: '#FC3D39',
      text: '#FFFFFF',
      accent: '#E02E2A',
      shadow: 'rgba(252, 61, 57, 0.3)'
    },
    purple: { 
      bg: 'rgba(177, 93, 255, 0.4)',         // Mantido para compatibilidade
      bgSolid: '#B15DFF',
      text: '#FFFFFF',
      accent: '#9A3EE6',
      shadow: 'rgba(177, 93, 255, 0.3)'
    },
  };

  const config = colorConfig[color];

  const size = 56;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage !== undefined ? percentage : (value ? Math.min((value / 100) * 100, 100) : 0);
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <div className="apple-card flex flex-col p-ios-5 gap-ios-4">
        <Skeleton className="h-14 w-14 rounded-ios-lg" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative fitness-card-translucent flex flex-col overflow-hidden group cursor-pointer"
      style={{ 
        backgroundColor: config.bg,
        borderRadius: '24px',
        padding: '20px',
        gap: '12px',
        boxShadow: `0 2px 8px ${config.shadow}`,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* Header with title and circle */}
      <div className="flex items-start justify-between">
        {/* Title */}
        <div className="flex-1">
          <div 
            className="font-medium text-xs uppercase tracking-wide opacity-90" 
            style={{ 
              color: config.bgSolid, 
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </div>
        </div>

        {/* Small Progress Circle */}
        <div className="relative flex-shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg 
            className="absolute transform -rotate-90" 
            width={size} 
            height={size}
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={config.bgSolid}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="font-semibold" 
              style={{ 
                color: config.bgSolid, 
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              {Math.round(percent)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-1">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-bold leading-none" 
          style={{ 
            color: config.bgSolid, 
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: '1',
            letterSpacing: '-0.5px'
          }}
        >
          {percentage !== undefined ? Math.round(percentage) : value ?? '-'}
        </motion.span>
        {percentage !== undefined && (
          <span 
            className="font-medium opacity-80" 
            style={{ 
              color: config.bgSolid, 
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            %
          </span>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div 
        className="absolute inset-0 rounded-ios-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${config.bgSolid}20 0%, transparent 100%)`
        }}
      />
    </motion.div>
  );
};

export default MetricCard;
