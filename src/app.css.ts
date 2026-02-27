import {keyframes, style} from '@vanilla-extract/css';

export const container = style({
  width: '100%',
  minHeight: '100vh',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
});

/** Pre-start only: background (and base color) respects light/dark mode. */
export const containerSplash = style({
  background: '#000',
  color: 'rgba(255, 255, 255, 0.87)',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: '#fff',
      color: '#213547'
    }
  }
});

export const containerStarted = style({
  background: '#000',
  color: '#fff'
});

/** Corner wrapper for help/locale. */
export const topCorner = style({
  position: 'fixed',
  zIndex: 300,
  transition: 'opacity 0.35s ease'
});

export const topLeftCorner = style({
  top: '12px',
  left: '12px'
});

export const topRightCorner = style({
  top: '12px',
  right: '12px'
});

export const topCenter = style({
  position: 'fixed',
  zIndex: 300,
  top: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'opacity 0.35s ease',
  '@media': {
    '(max-width: 640px)': {
      top: '68px',
      left: 'auto',
      right: '12px',
      transform: 'none'
    },
    '(max-width: 640px) and (pointer: fine)': {
      top: '48px'
    }
  }
});

export const sourceButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  fontSize: '1.1rem',
  lineHeight: 1,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid rgba(0,0,0,0.2)',
      ':focus-visible': {
        outline: '2px solid rgba(0,0,0,0.4)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(0,0,0,0.35)',
        background: 'rgba(0,0,0,0.06)'
      }
    },
    '(pointer: fine)': {
      width: '28px',
      height: '28px',
      fontSize: '1rem'
    }
  }
});

export const sourceButtonAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.9)',
  borderColor: 'rgba(255,255,255,0.3)',
  borderStyle: 'solid',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.5)',
      color: 'rgba(255,255,255,0.9)',
      borderColor: 'rgba(255,255,255,0.3)',
      borderStyle: 'solid',
      ':focus-visible': {
        outline: '2px solid rgba(255,255,255,0.6)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    }
  }
});

export const sourceButtonActive = style({
  borderColor: 'rgba(255,255,255,0.85)',
  borderWidth: '2px',
  background: 'rgba(255,255,255,0.15)',
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.85)',
        background: 'rgba(255,255,255,0.15)'
      }
    },
    '(prefers-color-scheme: light)': {
      borderColor: 'rgba(0,0,0,0.6)',
      borderWidth: '2px',
      background: 'rgba(0,0,0,0.08)'
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(0,0,0,0.6)',
        background: 'rgba(0,0,0,0.08)'
      }
    }
  }
});

const pulse = keyframes({
  '0%, 100%': {opacity: 1},
  '50%': {opacity: 0.4}
});

export const sourceButtonPending = style({
  animation: `${pulse} 1.2s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      opacity: 0.5
    }
  }
});

export const hiddenInput = style({
  display: 'none'
});

export const topVisible = style({
  opacity: 1
});

export const topFaded = style({
  opacity: 0,
  pointerEvents: 'none'
});
