import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Joyride,
  ACTIONS,
  EVENTS,
  STATUS,
  type EventData,
  type Step,
} from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { joyrideBaseOptions, joyrideNotificationStyles } from './joyride/joyrideTourTheme';
import { isTourFlagCompleted, markTourFlagCompleted } from '../utils/tourRemoteState';

const NAV_DELAY_MS = 380;
const ONBOARDING_ROUTES = ['/', '/inspections', '/action-plans'];

export default function AppOnboardingTour() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isEnglish } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const pathRef = useRef(location.pathname);
  const autoStartScheduled = useRef(false);

  pathRef.current = location.pathname;

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="dashboard-welcome"]',
        title: t('tour.step1Title'),
        content: t('tour.step1Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="dock-inspections"]',
        title: t('tour.step2Title'),
        content: t('tour.step2Content'),
        placement: 'top',
      },
      {
        target: '[data-tour="inspections-orbital"]',
        title: t('tour.step3Title'),
        content: t('tour.step3Content'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="dock-action-plans"]',
        title: t('tour.step4Title'),
        content: t('tour.step4Content'),
        placement: 'top',
      },
      {
        target: '[data-tour="action-plans-main"]',
        title: t('tour.step5Title'),
        content: t('tour.step5Content'),
        placement: 'bottom',
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!user?.id || autoStartScheduled.current) return;
    if (isTourFlagCompleted('onboarding_v1', profile, user.id)) return;
    if (location.pathname !== '/') return;

    autoStartScheduled.current = true;
    const id = window.setTimeout(() => {
      if (pathRef.current !== '/') {
        autoStartScheduled.current = false;
        return;
      }
      if (isTourFlagCompleted('onboarding_v1', profile, user.id)) return;
      setStepIndex(0);
      setRun(true);
    }, 550);

    return () => {
      window.clearTimeout(id);
    };
  }, [user?.id, profile, location.pathname]);

  useEffect(() => {
    if (run && !ONBOARDING_ROUTES.includes(location.pathname)) {
      setRun(false);
    }
  }, [location.pathname, run]);

  const finishTour = useCallback(async () => {
    setRun(false);
    if (!user?.id) return;

    await markTourFlagCompleted('onboarding_v1', user.id, {
      currentAppTours: profile?.app_tours,
      refreshProfile,
    });
  }, [user?.id, profile?.app_tours, refreshProfile]);

  const scheduleAfterNav = useCallback((nextIndex: number) => {
    window.setTimeout(() => {
      setStepIndex(nextIndex);
    }, NAV_DELAY_MS);
  }, []);

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
        if (index === 1) {
          navigate('/inspections');
          scheduleAfterNav(2);
          return;
        }
        if (index === 3) {
          navigate('/action-plans');
          scheduleAfterNav(4);
          return;
        }
        if (index < steps.length - 1) {
          setStepIndex(index + 1);
        }
        return;
      }

      if (action === ACTIONS.PREV) {
        if (index === 2) {
          navigate('/');
          scheduleAfterNav(1);
          return;
        }
        if (index === 4) {
          navigate('/inspections');
          scheduleAfterNav(3);
          return;
        }
        if (index > 0) {
          setStepIndex(index - 1);
        }
        return;
      }

      if (action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
        void finishTour();
      }
    },
    [finishTour, navigate, scheduleAfterNav, steps.length],
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

  if (!user?.id) return null;
  if (isTourFlagCompleted('onboarding_v1', profile, user.id)) return null;

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
      options={joyrideBaseOptions}
    />
  );
}
