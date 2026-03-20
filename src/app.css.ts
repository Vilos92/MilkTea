import {style} from '@vanilla-extract/css';

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

export const cursorHidden = style({
  cursor: 'none'
});
