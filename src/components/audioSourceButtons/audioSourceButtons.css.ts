import {keyframes, style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const audioSourceRoot = style({
  position: 'fixed',
  zIndex: 300,
  top: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'nowrap',
  gap: '8px',
  transition: 'opacity 0.35s ease',
  selectors: {
    // Fewer than 4 visible buttons (input + buttons totals 4 children or fewer, no 5th).
    // Button count varies by platform: mic and screen-capture are each hidden when the
    // platform can't support them.
    '&:not(:has(> *:nth-child(5)))': {
      '@media': {
        '(max-width: 280px)': {top: '68px'},
        '(max-width: 280px) and (pointer: fine)': {top: '48px'}
      }
    },
    // 4 or more visible buttons (input + buttons totals 5 children or more).
    '&:has(> *:nth-child(5))': {
      '@media': {
        '(max-width: 350px)': {top: '68px'},
        '(max-width: 350px) and (pointer: fine)': {top: '48px'}
      }
    }
  }
});

export const audioSourceButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  padding: 0,
  fontSize: '1.2rem',
  lineHeight: 1,
  color: 'light-dark(rgba(0,0,0,0.85), rgba(255,255,255,0.9))',
  background: 'light-dark(rgba(255,255,255,0.85), rgba(0,0,0,0.45))',
  border: '1px solid light-dark(rgba(0,0,0,0.2), rgba(255,255,255,0.25))',
  borderRadius: '4px',
  ':focus-visible': {
    outline: '2px solid light-dark(rgba(0,0,0,0.4), rgba(255,255,255,0.6))',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'light-dark(rgba(0,0,0,0.35), rgba(255,255,255,0.5))',
        background: 'light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1))'
      }
    },
    '(pointer: fine)': {
      width: '28px',
      height: '28px',
      fontSize: '1rem'
    }
  }
});

export const audioSourceButtonAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.95)',
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
    }
  }
});

/** Active (selected) state when over visualizer. */
export const audioSourceButtonAlwaysLightActive = style({
  borderColor: 'rgba(255,255,255,0.7)',
  borderWidth: '2px',
  background: 'rgba(255,255,255,0.2)',
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.7)',
        background: 'rgba(255,255,255,0.2)'
      }
    }
  }
});

export const audioSourceButtonActive = style({
  borderColor: 'light-dark(rgba(0,0,0,0.6), rgba(255,255,255,0.85))',
  borderWidth: '2px',
  background: 'light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.15))',
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'light-dark(rgba(0,0,0,0.6), rgba(255,255,255,0.85))',
        background: 'light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.15))'
      }
    }
  }
});

const pulse = keyframes({
  '0%, 100%': {opacity: 1},
  '50%': {opacity: 0.4}
});

export const audioSourceButtonPending = style({
  animation: `${pulse} 1.2s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
      opacity: 0.5
    }
  }
});
