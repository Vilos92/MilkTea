import {style} from '@vanilla-extract/css';

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
  marginTop: '40px',
  paddingTop: '16px',
  gap: '16px',
  maxHeight: 'min(640px, calc(100vh - 80px))',
  boxSizing: 'border-box'
});

export const scrollArea = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  overflowY: 'auto',
  paddingTop: '16px'
});

export const localeRow = style({
  display: 'flex',
  justifyContent: 'center'
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
  letterSpacing: '0.06em',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
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
  fontSize: '14px',
  flexShrink: 0
});

export const actionCell = style({
  textAlign: 'right',
  flex: 1,
  minWidth: 0
});

const blueskyWrap = style({
  display: 'inline-flex',
  justifyContent: 'center',
  marginTop: '4px',
  cursor: 'pointer',
  textDecoration: 'none',
  alignSelf: 'center'
});

/** Splash: black on light background, white on dark. */
export const blueskyWrapSplash = style([
  blueskyWrap,
  {
    color: '#000',
    '@media': {
      '(prefers-color-scheme: dark)': {
        color: '#fff'
      },
      '(hover: hover)': {
        ':hover': {
          color: '#0085FF'
        }
      }
    }
  }
]);

/** Active overlay: white on dark. */
export const blueskyWrapActive = style([
  blueskyWrap,
  {
    color: 'rgba(255,255,255,0.9)',
    '@media': {
      '(hover: hover)': {
        ':hover': {
          color: '#0085FF'
        }
      }
    }
  }
]);
