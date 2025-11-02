import { Bell, UserCircle, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const DashboardHeader = () => {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <header className="flex flex-col px-4 pt-2 pb-4 bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border transition-colors duration-200">
      <div className="flex justify-between items-center h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue dark:bg-brand-blue flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
            <Bell size={24} />
          </button>
          <button className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
            <UserCircle size={24} />
          </button>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary capitalize transition-colors duration-200">
            {formattedDate}
          </h1>
          <ChevronDown size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
