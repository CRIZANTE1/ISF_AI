import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { PricingSection } from '../components/ui/pricing';

const PlanPaymentPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    // TODO: Implementar integração com sistema de pagamento
    // Por enquanto, apenas simula o upgrade
    setTimeout(() => {
      alert('Funcionalidade de upgrade em desenvolvimento. Entre em contato com o suporte para atualizar seu plano.');
      setUpgrading(false);
    }, 1000);
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
        monthly: 24.90,
        yearly: Math.round(24.90 * 12 * (1 - 0.12)),
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
        text: profile?.plan === 'premium' ? 'Plano Atual' : upgrading ? 'Processando...' : 'Fazer Upgrade',
        href: '#',
        onClick: profile?.plan === 'premium' ? undefined : handleUpgrade,
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
        onClick: () => alert('Entre em contato com nossa equipe de vendas para mais informações.'),
      },
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <PageHeader title="Planos e Preços" />
      <main className="py-8 pb-32">
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
