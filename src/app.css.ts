import {style} from '@vanilla-extract/css';

export const container = style({
  width: '100%',
  minHeight: '100vh',
  boxSizing: 'border-box',
  background: '#000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff'
});

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

/** Full-screen overlay. Black everywhere except the button area, which stays transparent. */
export const overlaySplash = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

/** Transparent cutout sized to the button. The black is done via box-shadow so the hole is the button area. */
export const splashCutout = style({
  boxShadow: '0 0 0 100vmax #000'
});

/** Reduced-motion splash: button + disclaimer in a column. Solid background so canvas doesn’t show through. */
export const splashCutoutColumn = style({
  boxShadow: '0 0 0 100vmax #000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '32px',
  background: '#000'
});

export const overlayHideCursor = style({
  cursor: 'none'
});

/** Reduced-motion: solid button so animation is not visible through it. */
export const btnSolid = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '200px',
  minHeight: '72px',
  padding: '20px 40px',
  fontSize: '18px',
  background: '#0a0a0a',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 0,
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'none',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.1)'
  },
  ':focus-visible': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.08)'
      }
    }
  }
});

/** Disclaimer for reduced-motion / art-exhibit context. */
export const splashDisclaimer = style({
  // width: 'min(90vw, 420px)',
  margin: '0 20px',
  padding: '14px 18px',
  background: 'rgba(0, 0, 0, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 0,
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'rgba(255, 255, 255, 0.88)',
  textAlign: 'center'
});

/** Transparent “window” so the canvas shows through. */
export const btn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '200px',
  minHeight: '72px',
  padding: '20px 40px',
  fontSize: '18px',
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 0,
  cursor: 'pointer',
  fontWeight: 600,
  textShadow: '0 0 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
  transition: 'border-color 0.15s ease, box-shadow 0.1s ease',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.1)'
  },
  ':focus-visible': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.08)'
      }
    }
  }
});
