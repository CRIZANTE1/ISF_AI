import React from 'react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { cn } from '../../utils/cn';
import { CheckCircleIcon, StarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

type FREQUENCY = 'monthly' | 'yearly';
const frequencies: FREQUENCY[] = ['monthly', 'yearly'];

interface Plan {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    tooltip?: string;
  }[];
  btn: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  highlighted?: boolean;
}

interface PricingSectionProps extends React.ComponentProps<'div'> {
  plans: Plan[];
  heading: string;
  description?: string;
}

export function PricingSection({
  plans,
  heading,
  description,
  ...props
}: PricingSectionProps) {
  const [frequency, setFrequency] = React.useState<'monthly' | 'yearly'>(
    'monthly',
  );

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-5 p-4',
        props.className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="text-center text-sm text-white/60 md:text-base">
            {description}
          </p>
        )}
      </div>
      <PricingFrequencyToggle
        frequency={frequency}
        setFrequency={setFrequency}
      />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard plan={plan} key={plan.name} frequency={frequency} />
        ))}
      </div>
    </div>
  );
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
  frequency: FREQUENCY;
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>;
};

export function PricingFrequencyToggle({
  frequency,
  setFrequency,
  ...props
}: PricingFrequencyToggleProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'bg-white/10 mx-auto flex w-fit rounded-full border border-white/20 p-1',
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className="relative px-4 py-1 text-sm capitalize text-white"
        >
          <span className="relative z-10">{freq === 'monthly' ? t('pricing.monthly') : t('pricing.yearly')}</span>
          {frequency === freq && (
            <span
              className="bg-white absolute inset-0 z-0 rounded-full transition-all duration-300"
              style={{ mixBlendMode: 'difference' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

type PricingCardProps = React.ComponentProps<'div'> & {
  plan: Plan;
  frequency?: FREQUENCY;
};

export function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  ...props
}: PricingCardProps) {
  const { t } = useTranslation();
  const price = plan.price[frequency];
  const isYearly = frequency === 'yearly';
  const discount = isYearly 
    ? Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100)
    : 0;

  return (
    <div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-lg border border-white/20 bg-black/50',
        plan.highlighted && 'border-white/40',
        className,
      )}
      {...props}
    >
      {plan.highlighted && (
        <div className="absolute inset-0 rounded-lg border-2 border-white/40 animate-pulse" />
      )}
      <div
        className={cn(
          'bg-white/5 rounded-t-lg border-b border-white/20 p-4',
          plan.highlighted && 'bg-white/10',
        )}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {plan.highlighted && (
            <p className="bg-black flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5 text-xs text-white">
              <StarIcon className="h-3 w-3 fill-current" />
              {t('pricing.popular')}
            </p>
          )}
          {isYearly && discount > 0 && (
            <p className="bg-white text-black flex items-center gap-1 rounded-md border border-white/20 px-2 py-0.5 text-xs font-semibold">
              {discount}{t('pricing.off')}
            </p>
          )}
        </div>

        <div className="text-lg font-medium text-white">{plan.name}</div>
        <p className="text-sm font-normal text-white/60">{plan.info}</p>
        <h3 className="mt-2 flex items-end gap-1">
          <span className="text-3xl font-bold text-white">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-white/60">
            {plan.name !== 'Trial'
              ? '/' + (frequency === 'monthly' ? t('pricing.month') : t('pricing.year'))
              : ''}
          </span>
        </h3>
      </div>
      <div
        className={cn(
          'space-y-4 px-4 py-6 text-sm text-white/80',
          plan.highlighted && 'bg-white/5',
        )}
      >
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-white" />
            {feature.tooltip ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <p className="cursor-pointer border-b border-dashed border-white/40">
                    {feature.text}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{feature.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p>{feature.text}</p>
            )}
          </div>
        ))}
      </div>
      <div
        className={cn(
          'mt-auto w-full border-t border-white/20 p-3',
          plan.highlighted && 'bg-white/10',
        )}
      >
        {plan.btn.onClick ? (
          <Button
            className="w-full"
            variant={plan.highlighted ? 'default' : 'outline'}
            onClick={plan.btn.onClick}
          >
            {plan.btn.text}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={plan.highlighted ? 'default' : 'outline'}
            asChild
          >
            <Link to={plan.btn.href}>{plan.btn.text}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}


