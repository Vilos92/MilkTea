import {style} from '@vanilla-extract/css';

/*
 * Overlay variants.
 */

const baseOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '24px',
  boxSizing: 'border-box',
  '@media': {
    /* When audio source row breaks, reserve top space so panel content clears it. */
    '(max-width: 350px)': {paddingTop: '88px'},
    '(max-width: 350px) and (pointer: fine)': {paddingTop: '48px'}
  }
});

/** Always dark (e.g. over a dark canvas). */
export const overlayDark = style([
  baseOverlay,
  {
    background: 'rgba(0,0,0,0.72)',
    color: '#fff'
  }
]);

/** Theme-aware through the inherited color scheme. */
export const overlayAdaptive = style([
  baseOverlay,
  {
    background: 'light-dark(#fff, #0a0a0a)',
    color: 'light-dark(#213547, #fff)'
  }
]);

/*
 * Panel.
 */

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  maxWidth: '420px',
  width: '100%',
  marginTop: '40px',
  padding: '0 24px',
  boxSizing: 'border-box'
});

export const header = style({
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingTop: '16px',
  paddingBottom: '16px'
});

export const headingRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
});

const headingBase = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

export const headingDark = style({
  ...headingBase,
  color: 'rgba(255,255,255,0.6)'
});

export const headingAdaptive = style({
  ...headingBase,
  color: 'light-dark(rgba(0,0,0,0.65), rgba(255,255,255,0.6))'
});

/*
 * Search input.
 */

export const searchInputDark = style({
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'inherit',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  boxSizing: 'border-box',
  '::placeholder': {
    color: 'rgba(255,255,255,0.5)'
  },
  ':focus': {
    outline: 'none',
    borderColor: 'rgba(255,255,255,0.4)'
  }
});

export const searchInputAdaptive = style({
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  lineHeight: 1.4,
  color: 'inherit',
  background: 'light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.08))',
  border: '1px solid light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.2))',
  borderRadius: '4px',
  boxSizing: 'border-box',
  '::placeholder': {
    color: 'light-dark(rgba(0,0,0,0.45), rgba(255,255,255,0.5))'
  },
  ':focus': {
    outline: 'none',
    borderColor: 'light-dark(rgba(0,0,0,0.35), rgba(255,255,255,0.4))'
  }
});

/*
 * Scroll area.
 */

export const scrollArea = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  paddingBottom: '16px'
});

/*
 * Close button.
 */

const closeBtnCornerBase = {
  flexShrink: 0,
  marginRight: '-12px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  appearance: 'none' as const,
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  color: 'rgba(255,255,255,0.45)',
  fontSize: '16px',
  lineHeight: 1,
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 2
  }
};

export const closeBtnDark = style({
  ...closeBtnCornerBase,
  '@media': {
    '(pointer: coarse)': {
      width: '44px',
      height: '44px',
      color: 'rgba(255,255,255,0.65)',
      marginRight: '-16px'
    },
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.9)'
      }
    }
  }
});

export const closeBtnAdaptive = style({
  ...closeBtnCornerBase,
  color: 'light-dark(rgba(0,0,0,0.4), rgba(255,255,255,0.45))',
  ':focus-visible': {
    outline: '2px solid light-dark(rgba(0,0,0,0.4), rgba(255,255,255,0.5))',
    outlineOffset: 2
  },
  '@media': {
    '(pointer: coarse)': {
      width: '44px',
      height: '44px',
      color: 'light-dark(rgba(0,0,0,0.4), rgba(255,255,255,0.65))',
      marginRight: '-16px'
    },
    '(hover: hover)': {
      ':hover': {
        background: 'light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.1))',
        color: 'light-dark(rgba(0,0,0,0.8), rgba(255,255,255,0.9))'
      }
    }
  }
});
