import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

const PageHeader = ({ title, children }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 frosted-glass border-b border-[var(--border-current)] transition-colors duration-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-[var(--text-secondary-current)] hover:text-[var(--text-primary-current)] transition-colors"
        >
          <ChevronLeft size={24} className="text-[var(--text-secondary-current)]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary-current)] truncate transition-colors duration-200">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
