import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const splashOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff'
});

/** Transparent cutout sized to the button only. The dark overlay is box-shadow, the hole is the button area. */
export const splashCutout = style({
  boxShadow: '0 0 0 100vmax #000',
  '@media': {
    '(prefers-color-scheme: light)': {
      boxShadow: '0 0 0 100vmax #fff'
    }
  }
});

export const splashCutoutColumn = style({
  boxShadow: '0 0 0 100vmax #000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '32px',
  background: '#000',
  '@media': {
    '(prefers-color-scheme: light)': {
      boxShadow: '0 0 0 100vmax #fff',
      background: '#fff'
    }
  }
});

/** Reduced-motion: solid button so animation is not visible through it. */
export const btnSolid = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '280px',
  height: '96px',
  padding: 0,
  boxSizing: 'border-box',
  fontSize: '18px',
  background: '#0a0a0a',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: 0,
  fontWeight: 600,
  transition: 'none',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.1)'
  },
  ':focus-visible': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 32px rgba(255, 255, 255, 0.4), 0 0 64px rgba(255, 255, 255, 0.2)'
      }
    },
    '(prefers-color-scheme: light)': {
      border: '1px solid #333',
      ':active': {
        borderColor: '#111',
        boxShadow: '0 0 24px rgba(0,0,0,0.15), 0 0 48px rgba(0,0,0,0.08)'
      },
      ':focus-visible': {
        borderColor: '#111',
        boxShadow: '0 0 0 2px rgba(0,0,0,0.25)'
      },
      ':hover': {
        borderColor: '#555',
        boxShadow: '0 0 32px rgba(0,0,0,0.35), 0 0 64px rgba(0,0,0,0.2)'
      }
    }
  }
});

/** Wrapper for disclaimer block in reduced-motion layout. */
export const splashDisclaimerBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
});

export const splashDisclaimer = style({
  margin: '0 20px',
  padding: '14px 18px',
  background: 'rgba(0, 0, 0, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 0,
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'rgba(255, 255, 255, 0.88)',
  textAlign: 'center'
});

export const splashButtonContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
});

export const splashTitleLine = style({
  display: 'block',
  minHeight: '1.2em',
  lineHeight: 1.2,
  textAlign: 'center'
});

export const splashSubtext = style({
  fontSize: '0.65em',
  fontWeight: 500,
  opacity: 0.9
});

/** Wrapper for the language picker below the start button. */
export const splashLocaleWrap = style({
  marginTop: '24px'
});

/** Extra space above disclaimer when it sits below the language switcher (default splash). */
export const splashDisclaimerBelowLocale = style({
  marginTop: '32px'
});

export const btn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '280px',
  height: '96px',
  padding: 0,
  boxSizing: 'border-box',
  fontSize: '18px',
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: 0,
  fontWeight: 600,
  textShadow: '0 0 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
  transition: 'border-color 0.15s ease, box-shadow 0.1s ease',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.1)'
  },
  ':focus-visible': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 32px rgba(255, 255, 255, 0.4), 0 0 64px rgba(255, 255, 255, 0.2)'
      }
    },
    '(prefers-color-scheme: light)': {
      border: '1px solid #333',
      ':active': {
        borderColor: '#111',
        boxShadow: '0 0 24px rgba(0,0,0,0.15), 0 0 48px rgba(0,0,0,0.08)'
      },
      ':focus-visible': {
        borderColor: '#111',
        boxShadow: '0 0 0 2px rgba(0,0,0,0.25)'
      },
      ':hover': {
        borderColor: '#555',
        boxShadow: '0 0 32px rgba(0,0,0,0.35), 0 0 64px rgba(0,0,0,0.2)'
      }
    }
  }
});
