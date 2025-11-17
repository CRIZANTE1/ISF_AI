import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

interface PageHeaderProps {
  title: string | { key: string; defaultValue?: string };
  children?: React.ReactNode;
}

const PageHeader = ({ title, children }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Se title for objeto com chave de tradução, traduz; senão usa como está
  const displayTitle = typeof title === 'object' 
    ? t(title.key, { defaultValue: title.defaultValue || title.key })
    : title;

  return (
    <header 
      className="sticky top-0 flex items-center justify-between h-14 px-4 border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        zIndex: 20,
        position: 'sticky',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
        >
          <ChevronLeft size={24} style={{ color: 'inherit' }} />
        </button>
        <h1 className="text-xl font-bold truncate transition-colors duration-200" style={{ color: 'var(--foreground)' }}>
          {displayTitle}
        </h1>
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
