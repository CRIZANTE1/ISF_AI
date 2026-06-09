import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import ContextualJoyrideTour from './joyride/ContextualJoyrideTour';
import type { Step } from 'react-joyride';

type Props = {
  ready: boolean;
};

export default function AddInspectionTour({ ready }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="inspection-flow-instructions"]',
        title: t('tour.addInspection.step1Title'),
        content: t('tour.addInspection.step1Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="inspection-flow-equipment"]',
        title: t('tour.addInspection.step2Title'),
        content: t('tour.addInspection.step2Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="inspection-flow-datetime"]',
        title: t('tour.addInspection.step3Title'),
        content: t('tour.addInspection.step3Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="inspection-flow-submit"]',
        title: t('tour.addInspection.step4Title'),
        content: t('tour.addInspection.step4Content'),
        placement: 'top',
      },
    ],
    [t],
  );

  return (
    <ContextualJoyrideTour
      userId={user?.id}
      tourFlagKey="add_inspection_v1"
      steps={steps}
      shouldAutoStart={Boolean(ready && user?.id)}
      startDelayMs={1200}
      skipScroll
    />
  );
}
