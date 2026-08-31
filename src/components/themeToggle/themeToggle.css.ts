import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  padding: 0,
  boxSizing: 'border-box',
  flexShrink: 0,
  appearance: 'none',
  background: 'light-dark(rgba(255, 255, 255, 0.9), rgba(0, 0, 0, 0.5))',
  color: 'light-dark(#171717, #fff)',
  border: '1px solid light-dark(rgba(0, 0, 0, 0.24), rgba(255, 255, 255, 0.3))',
  borderRadius: 0,
  cursor: 'pointer',
  ':active': {
    background: 'light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.16))'
  },
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
      width: '28px',
      height: '28px'
    }
  }
});

export const icon = style({
  width: '20px',
  height: '20px',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  '@media': {
    '(pointer: fine)': {
      width: '16px',
      height: '16px'
    }
  }
});
