import Skeleton from '../Skeleton';

interface ListSkeletonProps {
  count?: number;
  itemClassName?: string;
}

export const ListSkeleton = ({ count = 5, itemClassName = 'h-16 w-full rounded-lg' }: ListSkeletonProps) => (
  <div className="space-y-3" aria-busy="true" role="status">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className={itemClassName} />
    ))}
  </div>
);
