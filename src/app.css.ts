import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const container = style({
  width: '100%',
  minHeight: '100vh',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
});

/** Pre-start only: background and base color respect the selected theme. */
export const containerSplash = style({
  background: 'light-dark(#fff, #000)',
  color: 'light-dark(#213547, rgba(255, 255, 255, 0.87))'
});

export const containerStarted = style({
  background: '#000',
  color: '#fff',
  colorScheme: 'dark'
});

export const cursorHidden = style({
  cursor: 'none'
});
