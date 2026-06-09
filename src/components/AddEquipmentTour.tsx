import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import ContextualJoyrideTour from './joyride/ContextualJoyrideTour';
import type { Step } from 'react-joyride';

type Props = {
  hasType: boolean;
};

export default function AddEquipmentTour({ hasType }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="add-equipment-intro"]',
        title: t('tour.addEquipment.step1Title'),
        content: t('tour.addEquipment.step1Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="add-equipment-id"]',
        title: t('tour.addEquipment.step2Title'),
        content: t('tour.addEquipment.step2Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="add-equipment-form-body"]',
        title: t('tour.addEquipment.step3Title'),
        content: t('tour.addEquipment.step3Content'),
        placement: 'top',
      },
      {
        target: '[data-tour="add-equipment-submit"]',
        title: t('tour.addEquipment.step4Title'),
        content: t('tour.addEquipment.step4Content'),
        placement: 'top',
      },
    ],
    [t],
  );

  return (
    <ContextualJoyrideTour
      userId={user?.id}
      tourFlagKey="add_equipment_v1"
      steps={steps}
      shouldAutoStart={Boolean(hasType && user?.id)}
    />
  );
}
