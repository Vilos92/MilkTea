import {style} from '@vanilla-extract/css';

export const panel = style({
  width: 'min(420px, calc(100vw - 48px))',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: 'auto 0',
  padding: '24px',
  boxSizing: 'border-box'
});

export const percentage = style({
  margin: 0,
  fontSize: '36px',
  fontVariantNumeric: 'tabular-nums'
});

export const progressTrack = style({
  height: '2px',
  background: 'rgba(255,255,255,0.2)'
});

export const progressFill = style({
  height: '100%',
  background: 'rgba(255,255,255,0.9)',
  transition: 'width 0.15s linear'
});

export const time = style({
  margin: 0,
  color: 'rgba(255,255,255,0.6)',
  fontSize: '12px',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em'
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
});

export const action = style({
  appearance: 'none',
  padding: 0,
  background: 'transparent',
  border: 0,
  color: 'rgba(255,255,255,0.9)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '12px',
  letterSpacing: '0.06em',
  textDecoration: 'none',
  textTransform: 'uppercase',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 4
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        color: '#0085FF'
      }
    }
  }
});
