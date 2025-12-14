import { useNavigate } from 'react-router-dom';
import { QrCode, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const Utilities = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={{ key: 'utilities.title' }} />
      <main className="p-4 pb-32 relative" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => navigate('/utilities/qr-generator')}
              className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
              style={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)', 
                color: 'var(--foreground)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--ring)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <QrCode size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('utilities.qrGenerator')}</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t('utilities.qrGeneratorDescription')}
                </p>
              </div>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <button
              onClick={() => navigate('/utilities/custom-equipment')}
              className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
              style={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)', 
                color: 'var(--foreground)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--ring)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Package size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('utilities.customEquipment')}</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t('utilities.customEquipmentDescription')}
                </p>
              </div>
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Utilities;
