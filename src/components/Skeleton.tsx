interface SkeletonProps {
  className?: string;
  fullScreen?: boolean;
}

const Skeleton = ({ className = '', fullScreen = false }: SkeletonProps) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }}></div>
          <p className="text-white/60 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

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
