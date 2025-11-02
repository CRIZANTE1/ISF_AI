import Skeleton from './Skeleton';

interface MetricCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
  percentage?: number;
  color?: 'orange' | 'green' | 'blue' | 'purple';
}

const MetricCard = ({ title, value, isLoading, percentage, color = 'orange' }: MetricCardProps) => {
  const colorClasses = {
    orange: 'text-brand-orange',
    green: 'text-status-success',
    blue: 'text-brand-blue',
    purple: 'text-brand-purple',
  };

  const strokeColors = {
    orange: '#FF9500',
    green: '#34C759',
    blue: '#5AC8FA',
    purple: '#AF52DE',
  };

  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = percentage || (value ? Math.min((value / 100) * 100, 100) : 0);
  const offset = circumference - (percent / 100) * circumference;

  if (isLoading) {
    return (
      <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 flex flex-col items-center justify-center shadow-card border border-light-border dark:border-dark-border transition-colors duration-200">
        <Skeleton className="h-20 w-20 rounded-full mb-3" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 flex flex-col items-center justify-center shadow-card border border-light-border dark:border-dark-border transition-colors duration-200">
      <div className="relative w-20 h-20 mb-3">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="none"
            className="dark:stroke-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColors[color]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${colorClasses[color]}`}>
            {percentage !== undefined ? `${Math.round(percentage)}%` : value ?? '-'}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">{title}</span>
    </div>
  );
};

export default MetricCard;
