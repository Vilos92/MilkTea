import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const root = style({
  display: 'flex',
  alignItems: 'center'
});

export const label = style({
  fontSize: '12px',
  color: 'light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82))',
  whiteSpace: 'nowrap'
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

export const select = style({
  height: '48px',
  minWidth: '7em',
  padding: '0 16px',
  boxSizing: 'border-box',
  background: 'light-dark(rgba(255, 255, 255, 0.9), rgba(0, 0, 0, 0.5))',
  color: 'light-dark(#171717, #fff)',
  border: '1px solid light-dark(rgba(0, 0, 0, 0.24), rgba(255, 255, 255, 0.3))',
  borderRadius: 0,
  fontSize: '12px',
  ':focus-visible': {
    outline: '2px solid light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.65))',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        background: 'light-dark(#fff, rgba(0, 0, 0, 0.65))',
        borderColor: 'light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.5))'
      }
    },
    '(pointer: fine)': {
      height: '28px',
      padding: '0 8px'
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
