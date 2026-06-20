import Skeleton from '../Skeleton';
import { cn } from '../../utils/cn';

interface IconSkeletonProps {
  className?: string;
}

export const IconSkeleton = ({ className = 'h-4 w-4 rounded' }: IconSkeletonProps) => (
  <Skeleton className={cn(className)} />
);
