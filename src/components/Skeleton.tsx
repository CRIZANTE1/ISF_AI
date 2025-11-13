interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div 
      className={`rounded-md animate-pulse relative ${className}`} 
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
