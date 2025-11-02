import { Bell, UserCircle } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <header className="flex justify-between items-center h-14 px-4">
      <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">ISF IA</h1>
      <div className="flex items-center gap-4">
        <button className="text-dark-text-secondary hover:text-dark-text-primary transition-colors">
          <UserCircle size={24} />
        </button>
        <button className="text-dark-text-secondary hover:text-dark-text-primary transition-colors">
          <Bell size={24} />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
