import {style} from '@vanilla-extract/css';

export const helpButtonRoot = style({
  position: 'fixed',
  top: '12px',
  left: '12px',
  zIndex: 400,
  display: 'flex',
  alignItems: 'center',
  minHeight: '48px',
  '@media': {
    '(pointer: fine)': {
      minHeight: '28px'
    }
  }
});

export const helpButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  fontSize: '1.1rem',
  lineHeight: 1,
  background: 'transparent',
  color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  cursor: 'pointer',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.8)',
      border: '1px solid rgba(0,0,0,0.2)'
    },
    '(pointer: fine)': {
      width: '28px',
      height: '28px',
      fontSize: '1rem'
    }
  }
});

export const helpButtonAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.3)',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.5)',
      color: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(255,255,255,0.3)'
    }
  }
});
