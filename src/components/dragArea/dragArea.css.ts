import {style} from '@vanilla-extract/css';

export const dragWrapper = style({
  width: '100%',
  minHeight: '100vh'
});

export const dragIndicator = style({
  position: 'fixed',
  inset: 0,
  zIndex: 400,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.72) 70%)',
  color: '#fff'
});

export const dragIndicatorText = style({
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  textShadow: '0 2px 12px rgba(0,0,0,0.6)'
});
