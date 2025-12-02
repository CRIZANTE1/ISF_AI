import React from 'react';
import { Spinner } from './ui/spinner';
import { useTranslation } from '../hooks/useTranslation';

const SplashScreen = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-6">ISFIA</h1>
      <Spinner size="xl" color="white" />
      <p className="text-lg mt-6 text-white/60">{t('common.loading')}</p>
    </div>
  );
};

export default SplashScreen;
