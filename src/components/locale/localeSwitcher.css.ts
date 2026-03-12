import {style} from '@vanilla-extract/css';

/** Shift row left so the select is visually centered (globe width + gap). */
export const root = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transform: 'translateX(calc(-0.5 * (1.5rem + 12px)))',
  '@media': {
    '(pointer: fine)': {
      transform: 'translateX(calc(-0.5 * (1.25rem + 8px)))'
    }
  }
});

export const label = style({
  fontSize: '12px',
  color: 'rgba(255,255,255,0.7)',
  whiteSpace: 'nowrap',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.8)'
    }
  }
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  '@media': {
    '(pointer: fine)': {
      gap: '8px'
    }
  }
});

/** Fixed-width container so root transform can use exact (globe + gap) for centering. */
export const globeWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  flexShrink: 0,
  '@media': {
    '(pointer: fine)': {
      width: '1.25rem'
    }
  }
});

export const globe = style({
  fontSize: '1.5rem',
  lineHeight: 1,
  '@media': {
    '(pointer: fine)': {
      fontSize: '1.25rem'
    }
  }
});

/** Force light label so it’s visible over dark animations. */
export const labelAlwaysLight = style({
  color: 'rgba(255,255,255,0.92)',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(255,255,255,0.92)'
    }
  }
});

export const select = style({
  fontSize: '12px',
  height: '48px',
  minWidth: '7em',
  padding: '0 16px',
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  boxSizing: 'border-box',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.65)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(255,255,255,0.9)',
      color: '#213547',
      border: '1px solid rgba(0,0,0,0.2)',
      ':focus-visible': {
        outline: '2px solid rgba(0,0,0,0.4)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(0,0,0,0.35)',
        background: 'rgba(255,255,255,1)'
      }
    },
    '(pointer: fine)': {
      height: '28px',
      padding: '0 8px'
    }
  }
});

/** Force light select so it’s visible over dark animations. */
export const selectAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.65)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.3)',
      ':focus-visible': {
        outline: '2px solid rgba(255,255,255,0.6)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.65)'
      }
    }
  }
});

/** Visually hidden but accessible to screen readers. */
export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0
});
