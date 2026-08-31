import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const iconButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  padding: 0,
  fontSize: '1.2rem',
  lineHeight: 1,
  background: 'transparent',
  color: 'light-dark(rgba(0,0,0,0.8), rgba(255,255,255,0.8))',
  border: '1px solid light-dark(rgba(0,0,0,0.2), rgba(255,255,255,0.25))',
  borderRadius: '4px',
  selectors: {
    '&[data-active="true"]': {
      borderColor: 'light-dark(rgba(0,0,0,0.5), rgba(255,255,255,0.6))',
      background: 'light-dark(rgba(0,0,0,0.12), rgba(255,255,255,0.2))'
    }
  },
  ':focus-visible': {
    outline: '2px solid light-dark(rgba(0,0,0,0.4), rgba(255,255,255,0.6))',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover:not([data-active="true"])': {
          borderColor: 'light-dark(rgba(0,0,0,0.35), rgba(255,255,255,0.5))',
          background: 'light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1))'
        }
      }
    },
    '(pointer: fine)': {
      width: '28px',
      height: '28px',
      fontSize: '1rem'
    }
  }
});

export const iconButtonAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.3)',
  selectors: {
    '&[data-active="true"]': {
      borderColor: 'rgba(255,255,255,0.7)',
      background: 'rgba(255,255,255,0.25)'
    }
  },
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover:not([data-active="true"])': {
          borderColor: 'rgba(255,255,255,0.5)',
          background: 'rgba(255,255,255,0.1)'
        }
      }
    }
  }
});

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

export const hudVisible = style({
  opacity: 1
});

export const hudFaded = style({
  opacity: 0,
  pointerEvents: 'none'
});
