import {style} from '@vanilla-extract/css';

const baseOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  boxSizing: 'border-box'
});

/** Before visualizer started: solid background, respects light/dark mode. */
export const overlaySplash = style([
  baseOverlay,
  {
    background: '#0a0a0a',
    color: '#fff',
    '@media': {
      '(prefers-color-scheme: light)': {
        background: '#fff',
        color: '#213547'
      }
    }
  }
]);

/** Visualizer active: translucent so the canvas shows through. */
export const overlayActive = style([
  baseOverlay,
  {
    background: 'rgba(0,0,0,0.72)',
    color: '#fff'
  }
]);

export const content = style({
  maxWidth: '420px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '28px'
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
});

const headingBase = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em'
};

export const heading = style({
  ...headingBase,
  color: 'rgba(255,255,255,0.6)'
});

export const headingSplash = style({
  ...headingBase,
  color: 'rgba(255,255,255,0.6)',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.65)'
    }
  }
});

const textBase = {
  margin: 0,
  fontSize: '15px',
  lineHeight: 1.6
};

export const paragraph = style({
  ...textBase,
  color: 'rgba(255,255,255,0.9)'
});

export const paragraphSplash = style({
  ...textBase,
  color: 'rgba(255,255,255,0.9)',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: '#213547'
    }
  }
});

export const list = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  fontSize: '15px',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.9)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

export const listSplash = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  fontSize: '15px',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.9)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: '#213547'
    }
  }
});

export const hotkeyRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '16px'
});

export const keyCell = style({
  fontFamily: 'ui-monospace, monospace',
  fontSize: '14px',
  flexShrink: 0
});

export const actionCell = style({
  textAlign: 'right',
  flex: 1,
  minWidth: 0
});

export const closeRow = style({
  marginTop: '8px',
  display: 'flex',
  justifyContent: 'center'
});

export const closeBtn = style({
  padding: '10px 20px',
  fontSize: '14px',
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  cursor: 'pointer',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 2
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255,255,255,0.18)',
        borderColor: 'rgba(255,255,255,0.35)'
      }
    }
  }
});

export const closeBtnSplash = style({
  padding: '10px 20px',
  fontSize: '14px',
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  cursor: 'pointer',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 2
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255,255,255,0.18)',
        borderColor: 'rgba(255,255,255,0.35)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.08)',
      color: '#213547',
      border: '1px solid rgba(0,0,0,0.2)',
      ':focus-visible': {
        outline: '2px solid rgba(0,0,0,0.4)',
        outlineOffset: 2
      },
      ':hover': {
        background: 'rgba(0,0,0,0.12)',
        borderColor: 'rgba(0,0,0,0.3)'
      }
    }
  }
});
