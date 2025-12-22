import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import HelpTip from './HelpTip';

interface PageHeaderProps {
  title: string | { key: string; defaultValue?: string };
  children?: React.ReactNode;
  help?: {
    title?: string;
    content?: React.ReactNode;
    titleKey?: string;
    contentKey?: string;
  };
}

const PageHeader = ({ title, children, help }: PageHeaderProps) => {
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
        backgroundColor: '#000000',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        zIndex: 20,
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
        minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 transition-colors"
          style={{ color: '#8E8E93' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8E8E93'}
        >
          <ChevronLeft size={24} style={{ color: 'inherit' }} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold truncate transition-colors duration-200" style={{ color: '#FFFFFF' }}>
            {displayTitle}
          </h1>
          {help && (
            <HelpTip 
              content={help.content} 
              title={help.title}
              contentKey={help.contentKey}
              titleKey={help.titleKey || (!help.title && !help.titleKey && typeof displayTitle === 'string' ? undefined : undefined)}
            />
          )}
        </div>
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
