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
    cyan: { text: '#00C8FF', bg: 'rgba(0, 200, 255, 0.1)', border: 'rgba(0, 200, 255, 0.15)' },
    green: { text: '#00D97E', bg: 'rgba(0, 217, 126, 0.1)', border: 'rgba(0, 217, 126, 0.15)' },
    orange: { text: '#FFA800', bg: 'rgba(255, 168, 0, 0.1)', border: 'rgba(255, 168, 0, 0.15)' },
    purple: { text: '#8A3FFC', bg: 'rgba(138, 63, 252, 0.1)', border: 'rgba(138, 63, 252, 0.15)' },
  };

  const config = colorConfig[color];

  const size = 100;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage || (value ? Math.min((value / 100) * 100, 100) : 0);
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-6 flex flex-col items-center justify-center shadow-card border border-dark-inactive" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
        <Skeleton className="h-28 w-28 rounded-full mb-4" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl p-6 flex flex-col items-center justify-center shadow-card border transition-all duration-200"
      style={{ 
        backgroundColor: '#1A1A1A', 
        borderColor: config.border,
        borderWidth: '1px'
      }}
    >
      <div className="relative w-28 h-28 mb-5">
        <svg className="transform -rotate-90 w-28 h-28">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2A2A2A"
            strokeWidth={strokeWidth}
            fill="none"
          />
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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-semibold" style={{ color: config.text }}>
            {percentage !== undefined ? `${Math.round(percentage)}%` : value ?? '-'}
          </span>
        </div>
      </div>
      <span className="text-caption font-medium text-text-secondary" style={{ fontSize: '14px', color: '#B0B0B0' }}>{title}</span>
    </div>
  );
};

export default MetricCard;
