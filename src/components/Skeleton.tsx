import { CSSProperties } from 'react';
import { cn } from '../utils/cn';
import { FullScreenSkeleton } from './skeletons/FullScreenSkeleton';

interface SkeletonProps {
  className?: string;
  fullScreen?: boolean;
  style?: CSSProperties;
}

const Skeleton = ({ className = '', fullScreen = false, style }: SkeletonProps) => {
  if (fullScreen) {
    return <FullScreenSkeleton className={className} />;
  }

  return (
    <div
      className={cn('rounded-md animate-pulse relative', className)}
      style={{
        zIndex: 10,
        position: 'relative',
        backgroundColor: 'rgba(26, 26, 26, 0.8)',
        borderRadius: 'var(--radius)',
        ...style,
      }}
    />
  );
};

export default Skeleton;
