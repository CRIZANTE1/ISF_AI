import type { Styles } from 'react-joyride';

/** Visual alinhado a cards de notificação: cantos arredondados, blur e borda suave. */
export const joyrideNotificationStyles: Partial<Styles> = {
  tooltip: {
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    overflow: 'hidden',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.3,
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.5,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tooltipFooter: {
    marginTop: 4,
  },
  buttonPrimary: {
    borderRadius: 10,
    fontWeight: 600,
  },
  buttonBack: {
    borderRadius: 10,
  },
  buttonSkip: {
    borderRadius: 10,
  },
};

export const joyrideBaseOptions = {
  backgroundColor: '#1a1a1a',
  textColor: '#f5f5f5',
  primaryColor: '#ffffff',
  overlayColor: 'rgba(0,0,0,0.82)',
  zIndex: 10050,
  showProgress: true,
  overlayClickAction: false,
  buttons: ['back', 'close', 'primary', 'skip'] as const,
  spotlightPadding: 12,
  disableFocusTrap: true,
  targetWaitTimeout: 5000,
};
