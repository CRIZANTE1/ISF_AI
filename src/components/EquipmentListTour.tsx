import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import ContextualJoyrideTour from './joyride/ContextualJoyrideTour';
import type { Step } from 'react-joyride';

type Props = {
  loading: boolean;
  hasType: boolean;
};

export default function EquipmentListTour({ loading, hasType }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isListRoute = /^\/inspections\/[^/]+$/.test(location.pathname);

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="equipment-list-instructions"]',
        title: t('tour.equipmentList.step1Title'),
        content: t('tour.equipmentList.step1Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="equipment-list-actions"]',
        title: t('tour.equipmentList.step2Title'),
        content: t('tour.equipmentList.step2Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="equipment-list-fab"]',
        title: t('tour.equipmentList.step3Title'),
        content: t('tour.equipmentList.step3Content'),
        placement: 'left',
      },
      {
        target: '[data-tour="equipment-list-content"]',
        title: t('tour.equipmentList.step4Title'),
        content: t('tour.equipmentList.step4Content'),
        placement: 'top',
      },
    ],
    [t],
  );

  return (
    <ContextualJoyrideTour
      userId={user?.id}
      tourFlagKey="equipment_list_v1"
      steps={steps}
      shouldAutoStart={Boolean(hasType && !loading && isListRoute && user?.id)}
    />
  );
}
