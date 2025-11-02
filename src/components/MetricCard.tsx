import Skeleton from './Skeleton';

interface MetricCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
}

const MetricCard = ({ title, value, isLoading }: MetricCardProps) => {
  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 flex flex-col justify-between h-28">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </>
      ) : (
        <>
          <span className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">{value ?? '-'}</span>
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{title}</span>
        </>
      )}
    </div>
  );
};

export default MetricCard;
