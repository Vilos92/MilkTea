import {style} from '@vanilla-extract/css';

export const visualizerOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
});

export const presetNameNotify = style({
  position: 'fixed',
  bottom: '112px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90vw',
  textAlign: 'center',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity 0.5s ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'opacity 0.15s ease-out'
    }
  }
});

export const trackNameNotify = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  textAlign: 'center',
  color: '#fff',
  fontSize: '20px',
  fontWeight: 500,
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  pointerEvents: 'none',
  opacity: 1,
  transition: 'opacity 0.5s ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'opacity 0.15s ease-out'
    }
  }
});

export const faded = style({
  opacity: 0
});
