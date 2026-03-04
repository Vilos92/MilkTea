import {style} from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

/** Full-screen overlay. Black everywhere except the button area, which stays transparent. */
export const overlaySplash = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff'
});

/** Transparent cutout sized to the button. The black is done via box-shadow so the hole is the button area. */
export const splashCutout = style({
  boxShadow: '0 0 0 100vmax #000',
  '@media': {
    '(prefers-color-scheme: light)': {
      boxShadow: '0 0 0 100vmax #fff'
    }
  }
});

/** Reduced-motion splash: button + disclaimer in a column. Solid background so canvas doesn't show through. */
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

export const overlayHideCursor = style({
  cursor: 'none'
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

/** Disclaimer for reduced-motion / art-exhibit context. */
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

/** Two-line splash label (localized title + "MilkTea" subtext) when `locale !== 'en'`. */
export const splashButtonContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
});

/** Fixed-height slot for the top line so subtext doesn't cause layout shift. */
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

/** Transparent "window" so the canvas shows through. */
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

export const presetNameNotify = style({
  position: 'fixed',
  bottom: '112px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90vw',
  textAlign: 'center',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity 0.5s ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'opacity 0.15s ease-out'
    }
  }
});

export const presetNameNotifyAtBottom = style({
  bottom: '52px'
});

export const trackNameNotify = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  textAlign: 'center',
  color: '#fff',
  fontSize: '20px',
  fontWeight: 500,
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity 0.5s ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'opacity 0.15s ease-out'
    }
  }
});

export const faded = style({
  opacity: 0
});
