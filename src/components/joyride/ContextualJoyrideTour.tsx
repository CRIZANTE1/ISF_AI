import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Joyride,
  ACTIONS,
  EVENTS,
  STATUS,
  type EventData,
  type Step,
} from 'react-joyride';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
  isTourFlagCompleted,
  markTourFlagCompleted,
  type TourFlagKey,
} from '../../utils/tourRemoteState';
import { joyrideBaseOptions, joyrideNotificationStyles } from './joyrideTourTheme';

const DEFAULT_DELAY_MS = 500;

type Props = {
  userId: string | undefined;
  tourFlagKey: TourFlagKey;
  steps: Step[];
  shouldAutoStart: boolean;
  startDelayMs?: number;
  skipScroll?: boolean;
  onPersisted?: () => void;
};

export default function ContextualJoyrideTour({
  userId,
  tourFlagKey,
  steps,
  shouldAutoStart,
  startDelayMs = DEFAULT_DELAY_MS,
  skipScroll = false,
  onPersisted,
}: Props) {
  const { profile, refreshProfile } = useAuth();
  const { t, isEnglish } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const shouldAutoStartRef = useRef(shouldAutoStart);
  const startedRef = useRef(false);

  shouldAutoStartRef.current = shouldAutoStart;

  useEffect(() => {
    if (!userId || startedRef.current) return;
    if (isTourFlagCompleted(tourFlagKey, profile, userId)) return;
    if (!shouldAutoStart) return;

    const id = window.setTimeout(() => {
      if (!shouldAutoStartRef.current) return;
      if (isTourFlagCompleted(tourFlagKey, profile, userId)) return;
      startedRef.current = true;
      setStepIndex(0);
      setRun(true);
    }, startDelayMs);

    return () => window.clearTimeout(id);
  }, [userId, tourFlagKey, profile, shouldAutoStart, startDelayMs]);

  const finishTour = useCallback(async () => {
    setRun(false);
    if (!userId) return;

    await markTourFlagCompleted(tourFlagKey, userId, {
      currentAppTours: profile?.app_tours,
      refreshProfile,
    });
    onPersisted?.();
  }, [userId, tourFlagKey, profile?.app_tours, refreshProfile, onPersisted]);

  const handleEvent = useCallback(
    (data: EventData) => {
      const { type, action, index, status } = data;

      if (type === EVENTS.TOUR_END) {
        void finishTour();
        return;
      }

      if (status === STATUS.SKIPPED || status === STATUS.FINISHED) {
        void finishTour();
        return;
      }

      if (type === EVENTS.TARGET_NOT_FOUND) {
        if (index < steps.length - 1) {
          setStepIndex(index + 1);
        } else {
          void finishTour();
        }
        return;
      }

      if (type !== EVENTS.STEP_AFTER) return;

      if (action === ACTIONS.NEXT) {
        if (index < steps.length - 1) {
          setStepIndex(index + 1);
        }
        return;
      }

      if (action === ACTIONS.PREV) {
        if (index > 0) {
          setStepIndex(index - 1);
        }
        return;
      }

      if (action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
        void finishTour();
      }
    },
    [finishTour, steps.length],
  );

  const locale = useMemo(
    () => ({
      back: t('tour.buttons.back'),
      close: t('tour.buttons.close'),
      last: t('tour.buttons.last'),
      next: t('tour.buttons.next'),
      skip: t('tour.buttons.skip'),
      nextWithProgress: isEnglish
        ? 'Next ({current} of {total})'
        : 'Próximo ({current} de {total})',
    }),
    [t, isEnglish],
  );

  if (!userId || steps.length === 0) return null;
  if (isTourFlagCompleted(tourFlagKey, profile, userId)) return null;

  return (
    <Joyride
      continuous
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      locale={locale}
      scrollToFirstStep
      onEvent={handleEvent}
      styles={joyrideNotificationStyles}
      options={{
        ...joyrideBaseOptions,
        skipScroll,
      }}
    />
  );
}
