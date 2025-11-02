import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TrialStatusBar from '../components/TrialStatusBar';
import { CreditCard, Crown, Calendar, Check, X, ArrowRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const getPlanInfo = () => {
    if (profile?.plan === 'premium') {
      return {
        name: 'Plano Premium',
        description: 'Acesso completo a todas as funcionalidades',
        price: 'R$ 99,90',
        period: 'mensal',
        features: [
          'Gestão ilimitada de equipamentos',
          'Inspeções ilimitadas',
          'Relatórios avançados',
          'Suporte prioritário',
          'Backup automático de dados',
          'Exportação de dados',
        ],
        isCurrent: true,
      };
    } else {
      return {
        name: 'Plano Trial',
        description: 'Período de teste de 14 dias',
        price: 'Grátis',
        period: 'por 14 dias',
        features: [
          'Acesso limitado a funcionalidades',
          'Até 10 equipamentos',
          'Suporte por email',
        ],
        isCurrent: true,
        trialEndsAt: profile?.trial_ends_at,
      };
    }
  };

  const planInfo = getPlanInfo();
  const isTrial = profile?.plan === 'trial';
  const isPremium = profile?.plan === 'premium';

  return (
    <div className="min-h-screen">
      <PageHeader title="Plano e Pagamento" />
      <main className="p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Plano Atual */}
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border-2 border-brand-green">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-brand-green flex items-center gap-2">
                  <Crown size={24} />
                  {planInfo.name}
                </h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {planInfo.description}
                </p>
              </div>
              {planInfo.isCurrent && (
                <span className="px-3 py-1 bg-brand-green/20 text-brand-green rounded-full text-xs font-semibold">
                  Atual
                </span>
              )}
            </div>

            {isTrial && profile?.trial_ends_at && (
              <div className="mb-4 p-3 bg-light-background dark:bg-dark-background rounded-lg">
                <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <Calendar size={16} />
                  <span>
                    Trial expira em: {format(new Date(profile.trial_ends_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <TrialStatusBar profile={profile} />
              </div>
            )}

            <div className="mt-4">
              <p className="text-3xl font-bold text-brand-green">{planInfo.price}</p>
              {planInfo.period && (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {planInfo.period}
                </p>
              )}
            </div>

            <ul className="mt-6 space-y-2">
              {planInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check size={18} className="text-brand-green flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade para Premium (se for Trial) */}
          {isTrial && (
            <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
              <h3 className="text-lg font-semibold mb-2">Upgrade para Premium</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                Desbloqueie todas as funcionalidades com o plano Premium.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full flex items-center justify-center gap-2 p-3 bg-brand-green text-white font-bold rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                {upgrading ? 'Processando...' : (
                  <>
                    Upgrade para Premium
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Informações de Pagamento (se Premium) */}
          {isPremium && (
            <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Método de Pagamento
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                Gerenciar método de pagamento e histórico de faturas.
              </p>
              <button
                onClick={() => alert('Funcionalidade em desenvolvimento')}
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors text-sm"
              >
                Gerenciar Pagamento
              </button>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="p-4 bg-light-background dark:bg-dark-background rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Informações da Conta</h3>
            <div className="space-y-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              <p>Email: {user?.email}</p>
              {user?.created_at && (
                <p>Conta criada em: {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
              )}
              {profile?.role === 'admin' && (
                <p className="text-status-info font-semibold">Conta Administrativa</p>
              )}
            </div>
          </div>

          {/* Botão Voltar */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
          >
            Voltar ao Perfil
          </button>
        </div>
      </main>
    </div>
  );
};

export default PlanPaymentPage;

