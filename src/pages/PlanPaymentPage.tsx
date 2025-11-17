import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import PageHeader from '../components/PageHeader';
import { PricingSection } from '../components/ui/pricing';
import { useBilling, PRODUCT_IDS } from '../hooks/useBilling';
import { useErrorHandler } from '../hooks/useErrorHandler';

const PlanPaymentPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { handleError, showWarning, showInfo } = useErrorHandler();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  
  const {
    isAvailable,
    isInitialized,
    isInitializing,
    products,
    loading: billingLoading,
    purchase,
    getProductPrice,
  } = useBilling();

  const handleUpgrade = async () => {
    // Verificar se estamos no Android
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      showWarning('As compras in-app estão disponíveis apenas no aplicativo Android. Por favor, use o aplicativo para fazer upgrade.');
      return;
    }

    // Verificar se o billing está disponível
    if (!isAvailable || !isInitialized) {
      showWarning('Google Play Billing não está disponível. Verifique sua conexão e tente novamente.');
      return;
    }

    setUpgrading(true);
    setError(null);

    try {
      const productId = frequency === 'monthly' 
        ? PRODUCT_IDS.PREMIUM_MONTHLY 
        : PRODUCT_IDS.PREMIUM_YEARLY;

      const purchaseResult = await purchase(productId);
      
      if (purchaseResult) {
        // A compra foi processada com sucesso
        // O plano será atualizado automaticamente pelo billingService
        showInfo('Compra processada com sucesso! Atualizando seu plano...');
        // Recarregar a página após um breve delay para atualizar o perfil
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar compra';
      setError(errorMessage);
      handleError(err, 'profile', errorMessage);
    } finally {
      setUpgrading(false);
    }
  };

  // Função auxiliar para extrair preço numérico do formato "R$ 24,90"
  const parsePrice = (priceString: string): number => {
    if (!priceString) return 0;
    // Remove "R$", espaços e substitui vírgula por ponto
    const cleaned = priceString.replace(/R\$\s?/g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
  };

  // Obter preços dos produtos do Google Play ou usar fallback
  const getPremiumPrice = (freq: 'monthly' | 'yearly'): number => {
    const priceString = getProductPrice(PRODUCT_IDS.PREMIUM_MONTHLY, freq);
    const parsed = parsePrice(priceString);
    
    if (parsed > 0) {
      return parsed;
    }
    
    // Fallback para preços padrão
    return freq === 'monthly' ? 24.90 : Math.round(24.90 * 12 * (1 - 0.12));
  };

  const plans = [
    {
      name: 'Trial',
      info: 'Período de teste de 14 dias',
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        { text: 'Acesso limitado a funcionalidades' },
        { text: 'Até 10 equipamentos' },
        { text: 'Suporte por email' },
      ],
      btn: {
        text: profile?.plan === 'trial' ? 'Plano Atual' : 'Começar Trial',
        href: '#',
        onClick: profile?.plan === 'trial' ? undefined : () => navigate('/auth'),
      },
      highlighted: false,
    },
    {
      highlighted: true,
      name: 'Premium',
      info: 'Para pequenas e médias empresas',
      price: {
        monthly: getPremiumPrice('monthly'),
        yearly: getPremiumPrice('yearly'),
      },
      features: [
        { text: 'Gestão ilimitada de equipamentos' },
        { text: 'Inspeções ilimitadas' },
        { text: 'Relatórios avançados' },
        { text: 'Suporte prioritário', tooltip: 'Suporte 24/7 via chat' },
        { text: 'Backup automático de dados' },
        { text: 'Exportação de dados' },
      ],
      btn: {
        text: profile?.plan === 'premium' 
          ? 'Plano Atual' 
          : (upgrading || billingLoading || isInitializing)
          ? 'Processando...' 
          : (!isAvailable || !isInitialized)
          ? 'Indisponível'
          : 'Fazer Upgrade',
        href: '#',
        onClick: profile?.plan === 'premium' 
          ? undefined 
          : (!isAvailable || !isInitialized || upgrading || billingLoading || isInitializing)
          ? undefined
          : handleUpgrade,
      },
    },
    {
      name: 'Enterprise',
      info: 'Para grandes organizações',
      price: {
        monthly: 99.90,
        yearly: Math.round(99.90 * 12 * (1 - 0.12)),
      },
      features: [
        { text: 'Tudo do Premium' },
        { text: 'Múltiplos usuários e permissões' },
        { text: 'API personalizada' },
        { text: 'Suporte dedicado', tooltip: 'Gerente de conta dedicado' },
        { text: 'Treinamento personalizado' },
        { text: 'SLA garantido' },
      ],
      btn: {
        text: 'Contatar Equipe',
        href: '#',
        onClick: () => showInfo('Entre em contato com nossa equipe de vendas para mais informações.'),
      },
    },
  ];

  useEffect(() => {
    // Verificar se há algum problema
    try {
      if (plans.length === 0) {
        setError('Nenhum plano disponível');
      }
    } catch (err) {
      console.error('Erro ao carregar página de planos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar planos');
    }
  }, [plans.length]);

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title="Planos e Preços" />
        <main className="py-8 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <div className="text-white text-center">
            <p className="text-red-500 mb-4">Erro ao carregar planos</p>
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
        <PageHeader title="Planos e Preços" />
        <main className="py-8 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <div className="text-white text-center">
            <p className="text-white/60">Carregando planos...</p>
          </div>
        </main>
      </div>
    );
  }

  // Mostrar mensagem se não estiver no Android
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Planos e Preços" />
      <main className="py-8 pb-32" style={{ backgroundColor: '#000000' }}>
        {!isAndroid && (
          <div className="mx-auto max-w-4xl mb-6 px-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
              <p className="text-yellow-400 text-sm">
                💡 As compras in-app estão disponíveis apenas no aplicativo Android. 
                Por favor, use o aplicativo para fazer upgrade do seu plano.
              </p>
            </div>
          </div>
        )}
        {isAndroid && !isAvailable && (
          <div className="mx-auto max-w-4xl mb-6 px-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm">
                ⚠️ Google Play Billing não está disponível. Verifique sua conexão e tente novamente.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="mx-auto max-w-4xl mb-6 px-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        <PricingSection
          plans={plans}
          heading="Planos que Crescem com Você"
          description="Seja você um iniciante ou uma empresa em crescimento, nossos planos flexíveis têm tudo o que você precisa — sem custos ocultos."
        />
      </main>
    </div>
  );
};

export default PlanPaymentPage;
