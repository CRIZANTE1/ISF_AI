import Skeleton from './Skeleton';
import { motion } from 'framer-motion';

interface CircularMetricProps {
  label: string;
  value: number | null;
  isLoading: boolean;
  percentage?: number;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'cyan';
  size?: number;
  strokeWidth?: number;
}

const CircularMetric = ({ 
  label, 
  value, 
  isLoading, 
  percentage, 
  color = 'blue',
  size = 200,
  strokeWidth = 20
}: CircularMetricProps) => {
  const colorConfig = {
    blue: { 
      primary: '#FFFFFF',        // Branco (substituído do azul)
      secondary: 'rgba(28, 28, 30, 0.8)', // Surface dark
    },
    green: { 
      primary: '#53D769',        // Fitness Exercise
      secondary: 'rgba(28, 28, 30, 0.8)',
    },
    orange: { 
      primary: '#FC3D39',        // Fitness Move
      secondary: 'rgba(28, 28, 30, 0.8)',
    },
    purple: { 
      primary: '#B15DFF',        // Purple
      secondary: 'rgba(28, 28, 30, 0.8)',
    },
    cyan: { 
      primary: '#FFFFFF',        // Branco (substituído do azul)
      secondary: 'rgba(28, 28, 30, 0.8)',
    },
  };

  const config = colorConfig[color];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage !== undefined ? percentage : 100; // Se não houver percentage, mostra 100% preenchido
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Skeleton className="rounded-full" style={{ width: `${size}px`, height: `${size}px` }} />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg 
        className="absolute transform -rotate-90" 
        width={size} 
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Background circle (dark gray) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={config.secondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle (colored) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={config.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div 
          className="font-semibold text-white text-center"
          style={{
            fontSize: `${size * 0.12}px`,
            fontWeight: 600,
            lineHeight: '1.2',
          }}
        >
          {label}
        </div>
        {value !== null && (
          <div 
            className="font-medium text-white/80 mt-1"
            style={{
              fontSize: `${size * 0.08}px`,
              fontWeight: 500,
            }}
          >
            {percentage !== undefined ? `${Math.round(percentage)}%` : value}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularMetric;

