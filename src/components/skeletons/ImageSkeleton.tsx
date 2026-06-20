import Skeleton from '../Skeleton';
import { cn } from '../../utils/cn';

interface ImageSkeletonProps {
  className?: string;
  fullScreen?: boolean;
}

export const ImageSkeleton = ({ className, fullScreen = false }: ImageSkeletonProps) => {
  if (fullScreen) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50" aria-busy="true" role="status">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  return <Skeleton className={cn('h-full w-full', className)} aria-busy="true" role="status" />;
};
