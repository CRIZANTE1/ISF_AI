import Skeleton from '../Skeleton';
import { cn } from '../../utils/cn';

interface FullScreenSkeletonProps {
  className?: string;
}

export const FullScreenSkeleton = ({ className }: FullScreenSkeletonProps) => (
  <div
    className={cn('min-h-screen flex flex-col', className)}
    style={{ backgroundColor: '#000000' }}
    aria-busy="true"
    role="status"
  >
    <Skeleton className="h-14 w-full rounded-none" />
    <div className="flex-1 p-4 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  </div>
);
