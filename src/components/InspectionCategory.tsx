import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface InspectionCategoryProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const InspectionCategory = ({ title, icon, children }: InspectionCategoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div style={{ color: '#72DEFF' }}>{icon}</div>
          <span className="font-semibold text-lg text-[var(--text-primary-current)]">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-[var(--text-secondary-current)]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-2 pl-4 pr-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspectionCategory;
