import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

const PageHeader = ({ title, children }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-light-background/95 dark:bg-dark-background/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border transition-colors duration-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
        >
          <ChevronLeft size={24} color="#B0B0B0" />
        </button>
        <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary truncate transition-colors duration-200">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
