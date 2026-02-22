import {style} from '@vanilla-extract/css';

export const controls = style({
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.35s ease',
  // When a control has keyboard focus, keep the bar visible and interactive (overrides fade behavior)
  selectors: {
    '&:has(:focus-visible)': {
      opacity: '1 !important',
      pointerEvents: 'auto !important'
    } as Record<string, string>
  }
});

export const controlsPill = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '9999px',
  background: '#0a0a0a',
  transition: 'background 0.2s ease',
  '@media': {
    '(pointer: fine)': {
      gap: '8px',
      padding: '8px 12px'
    }
  }
});

export const controlsPillHovered = style({
  background: '#1a1a1a'
});

export const controlBtn = style({
  minWidth: '48px',
  minHeight: '48px',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  ':active': {
    background: 'rgba(255, 255, 255, 0.25)'
  },
  ':focus-visible': {
    background: 'rgba(255, 255, 255, 0.25)'
  },
  '@media': {
    '(pointer: fine)': {
      minWidth: '44px',
      minHeight: '44px'
    },
    // Only use :hover on devices that support it (avoids stuck hover after tap on touch)
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255, 255, 255, 0.25)'
      }
    }
  }
});
