import LoadingScreen from './LoadingScreen';
import { cn } from '../utils/cn';

interface SkeletonProps {
  className?: string;
  fullScreen?: boolean;
}

const Skeleton = ({ className = '', fullScreen = false }: SkeletonProps) => {
  if (fullScreen) {
    return <LoadingScreen fullScreen={true} className={className} />;
  }

  return (
    <div 
      className={cn(
        'rounded-md animate-pulse relative',
        className
      )} 
      style={{ 
        zIndex: 10,
        position: 'relative',
        backgroundColor: 'rgba(26, 26, 26, 0.8)',
        borderRadius: 'var(--radius)',
      }} 
    />
  );
};

export default Skeleton;
