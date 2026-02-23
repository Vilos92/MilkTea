import {style} from '@vanilla-extract/css';

export const root = style({
  position: 'fixed',
  top: '12px',
  right: '12px',
  zIndex: 101,
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const label = style({
  fontSize: '12px',
  color: 'rgba(255,255,255,0.7)',
  whiteSpace: 'nowrap',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.8)'
    }
  }
});

/** Wraps globe + select so they share one flex alignment context and stay vertically centered. */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  '@media': {
    '(pointer: fine)': {
      gap: '8px'
    }
  }
});

export const globe = style({
  display: 'inline-block',
  fontSize: '1.5rem',
  lineHeight: 1,
  /** Nudge down so it aligns with the select content. */
  transform: 'translateY(2px)',
  '@media': {
    '(pointer: fine)': {
      fontSize: '1.25rem'
    }
  }
});

/** Force light label so it’s visible over dark animations (ignore color preference). */
export const labelAlwaysLight = style({
  color: 'rgba(255,255,255,0.92)',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(255,255,255,0.92)'
    }
  }
});

export const select = style({
  fontSize: '12px',
  height: '48px',
  minWidth: '7em',
  padding: '0 16px',
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  cursor: 'pointer',
  boxSizing: 'border-box',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(255,255,255,0.9)',
      color: '#213547',
      border: '1px solid rgba(0,0,0,0.2)'
    },
    '(pointer: fine)': {
      height: '28px',
      padding: '0 8px'
    }
  }
});

/** Force light select so it’s visible over dark animations (ignore color preference). */
export const selectAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.3)'
    }
  }
});
