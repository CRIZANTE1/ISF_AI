import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import PageHeader from '../components/PageHeader';
import { PricingSection } from '../components/ui/pricing';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { logger } from '../utils/logger';

/**
 * Função helper para abrir mailto de forma robusta
 * Funciona tanto em dispositivos móveis quanto no navegador
 */
const openMailto = (email: string, subject?: string, body?: string) => {
  // Construir o link mailto
  let mailtoLink = `mailto:${email}`;
  const params: string[] = [];
  
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }
  
  if (params.length > 0) {
    mailtoLink += `?${params.join('&')}`;
  }
  
  try {
    // Tentar abrir o mailto
    if (Capacitor.isNativePlatform()) {
      // Em dispositivos móveis, criar um elemento <a> e clicar nele
      // Isso abre o app de email padrão do dispositivo
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.target = '_system';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      // Remover o elemento após um pequeno delay para garantir que o click foi processado
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } else {
      // No navegador, criar elemento <a> em vez de window.location.href
      // Isso evita problemas de navegação indesejada
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.click();
    }
  } catch (error) {
    logger.error('Erro ao abrir mailto', 'pricing', error);
    // Fallback: tentar abrir em nova janela
    try {
      window.open(mailtoLink, '_blank');
    } catch (fallbackError) {
      logger.error('Erro no fallback do mailto', 'pricing', fallbackError);
    }
  }
};

const PlanPaymentPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { showInfo } = useErrorHandler();
  const { t, isEnglish } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const plans = useMemo(() => [
    {
      name: t('pricing.plans.trial.name'),
      info: t('pricing.plans.trial.info'),
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        { text: t('pricing.plans.trial.features.limitedAccess') },
        { text: t('pricing.plans.trial.features.upTo10Equipment') },
        { text: t('pricing.plans.trial.features.emailSupport') },
      ],
      btn: {
        text: profile?.plan === 'trial' ? t('pricing.plans.trial.currentPlan') : t('pricing.plans.trial.startTrial'),
        href: '#',
        onClick: profile?.plan === 'trial' ? undefined : () => navigate('/auth'),
      },
      highlighted: false,
    },
    {
      highlighted: true,
      name: t('pricing.plans.premium.name'),
      info: t('pricing.plans.premium.info'),
      price: {
        monthly: 'a combinar',
        yearly: 'a combinar',
      },
      features: [
        { text: t('pricing.plans.premium.features.unlimitedEquipment') },
        { text: t('pricing.plans.premium.features.unlimitedInspections') },
        { text: t('pricing.plans.premium.features.advancedReports') },
        { text: t('pricing.plans.premium.features.prioritySupport'), tooltip: t('pricing.plans.premium.features.prioritySupportTooltip') },
        { text: t('pricing.plans.premium.features.autoBackup') },
        { text: t('pricing.plans.premium.features.dataExport') },
      ],
      btn: {
        text: profile?.plan === 'premium' 
          ? t('pricing.plans.premium.currentPlan') 
          : t('pricing.plans.premium.contactTeam'),
        href: '#',
        onClick: profile?.plan === 'premium' 
          ? undefined 
          : (e?: React.MouseEvent) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              
              const email = t('pricing.plans.premium.contactEmail');
              const message = t('pricing.plans.premium.contactMessage');
              
              // Mostrar mensagem informativa primeiro (a mensagem já contém o email)
              // Usar duração maior para garantir que o usuário veja
              showInfo(message, 8000);
              
              // Depois tentar abrir cliente de email
              setTimeout(() => {
                const subject = isEnglish ? 'Premium Plan - Play Store' : 'Plano Premium - Play Store';
                const body = isEnglish 
                  ? 'I would like to purchase the Premium plan via Play Store.'
                  : 'Gostaria de adquirir o plano Premium via Play Store.';
                
                openMailto(email, subject, body);
              }, 300);
            },
      },
    },
    {
      name: t('pricing.plans.business.name'),
      info: t('pricing.plans.business.info'),
      price: {
        monthly: t('pricing.plans.business.price'),
        yearly: t('pricing.plans.business.price'),
      },
      features: [
        { text: t('pricing.plans.business.features.premiumFeatures') },
        { text: t('pricing.plans.business.features.multipleUsers') },
        { text: t('pricing.plans.business.features.customApi') },
        { text: t('pricing.plans.business.features.dedicatedSupport'), tooltip: t('pricing.plans.business.features.dedicatedSupportTooltip') },
        { text: t('pricing.plans.business.features.customTraining') },
        { text: t('pricing.plans.business.features.customApplication') },
      ],
      btn: {
        text: t('pricing.plans.business.contactTeam'),
        href: '#',
        onClick: (e?: React.MouseEvent) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          
          const email = t('pricing.plans.business.contactEmail');
          const message = t('pricing.plans.business.contactMessage');
          
          // Mostrar mensagem informativa primeiro com email
          const fullMessage = isEnglish 
            ? `${message} Email: ${email}`
            : `${message} Email: ${email}`;
          // Usar duração maior para garantir que o usuário veja
          showInfo(fullMessage, 8000);
          
          // Depois tentar abrir cliente de email
          setTimeout(() => {
            const subject = isEnglish ? 'Business Plan - Information' : 'Plano Business - Informações';
            const body = isEnglish 
              ? 'I would like more information about the Business plan.'
              : 'Gostaria de mais informações sobre o plano Business.';
            
            openMailto(email, subject, body);
          }, 300);
        },
      },
    },
  ], [
    t,
    isEnglish,
    profile?.plan,
    navigate,
    showInfo,
  ]);

  useEffect(() => {
    // Verificar se há algum problema
    try {
      if (plans.length === 0) {
        setError(t('pricing.noPlansAvailable'));
      }
    } catch (err) {
      logger.error('Erro ao carregar página de planos', 'billing', err);
      setError(err instanceof Error ? err.message : t('pricing.unknownError'));
    }
  }, [plans.length, t]);

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title={{ key: 'pricing.title', defaultValue: t('pricing.title') }} />
        <main className="py-8 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <div className="text-white text-center">
            <p className="text-red-500 mb-4">{t('pricing.errorLoading')}</p>
            <p className="text-white/60">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Verificar se plans está definido
  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title={{ key: 'pricing.title', defaultValue: t('pricing.title') }} />
        <main className="py-8 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <div className="text-white text-center">
            <p className="text-white/60">{t('pricing.loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'pricing.title', defaultValue: t('pricing.title') }} />
      <main className="py-8 pb-32" style={{ backgroundColor: '#000000' }}>
        {error && (
          <div className="mx-auto max-w-4xl mb-6 px-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        <PricingSection
          plans={plans}
          heading={t('pricing.heading')}
          description={t('pricing.description')}
        />
      </main>
    </div>
  );
};

export default PlanPaymentPage;
