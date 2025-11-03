import Skeleton from './Skeleton';

interface MetricCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
  percentage?: number;
  color?: 'cyan' | 'green' | 'orange' | 'purple';
}

const MetricCard = ({ title, value, isLoading, percentage, color = 'cyan' }: MetricCardProps) => {
  const colorConfig = {
    cyan: { 
      text: '#00C8FF', 
      bg: 'rgba(0, 200, 255, 0.12)', 
      border: 'rgba(0, 200, 255, 0.16)',
      accent: 'rgba(0, 200, 255, 0.08)'
    },
    green: { 
      text: '#00D97E', 
      bg: 'rgba(0, 217, 126, 0.12)', 
      border: 'rgba(0, 217, 126, 0.16)',
      accent: 'rgba(0, 217, 126, 0.08)'
    },
    orange: { 
      text: '#FFA800', 
      bg: 'rgba(255, 168, 0, 0.12)', 
      border: 'rgba(255, 168, 0, 0.16)',
      accent: 'rgba(255, 168, 0, 0.08)'
    },
    purple: { 
      text: '#8A3FFC', 
      bg: 'rgba(138, 63, 252, 0.12)', 
      border: 'rgba(138, 63, 252, 0.16)',
      accent: 'rgba(138, 63, 252, 0.08)'
    },
  };

  const config = colorConfig[color];

  const size = 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage !== undefined ? percentage : (value ? Math.min((value / 100) * 100, 100) : 0);
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <div className="rounded-xl p-6 flex flex-col gap-4 border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <div 
      className="relative rounded-xl p-6 flex flex-col gap-4 border hover:border-opacity-40 transition-all duration-200 group overflow-hidden"
      style={{ 
        backgroundColor: '#1A1A1A', 
        borderColor: config.border,
        borderWidth: '1px'
      }}
    >
      {/* Header with title and circle */}
      <div className="flex items-start justify-between">
        {/* Title */}
        <div className="flex-1">
          <div 
            className="font-medium mb-1" 
            style={{ 
              color: '#B0B0B0', 
              fontSize: '13px',
              fontWeight: 500
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
              stroke="#2A2A2A"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={config.text}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-800 ease-out"
            />
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="font-semibold" 
              style={{ 
                color: config.text, 
                fontSize: '13px',
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
        <span 
          className="font-bold leading-none" 
          style={{ 
            color: '#FFFFFF', 
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: '1'
          }}
        >
          {percentage !== undefined ? Math.round(percentage) : value ?? '-'}
        </span>
        {percentage !== undefined && (
          <span 
            className="font-semibold" 
            style={{ 
              color: '#B0B0B0', 
              fontSize: '16px',
              fontWeight: 600,
              opacity: 0.6
            }}
          >
            %
          </span>
        )}
      </div>

      {/* Background accent */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${config.accent} 0%, transparent 100%)`
        }}
      />
    </div>
  );
};

export default MetricCard;
