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

export const topVisible = style({
  opacity: 1
});

export const topFaded = style({
  opacity: 0,
  pointerEvents: 'none'
});
