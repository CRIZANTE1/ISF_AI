import Skeleton from '../Skeleton';
import { cn } from '../../utils/cn';

interface ButtonSkeletonProps {
  width?: string;
  className?: string;
}

export const ButtonSkeleton = ({ width = 'w-20', className }: ButtonSkeletonProps) => (
  <Skeleton className={cn('h-4 inline-block', width, className)} />
);
