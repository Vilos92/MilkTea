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
  boxSizing: 'border-box'
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

export const headingRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
});

export const header = style({
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingTop: '16px',
  paddingBottom: '16px'
});

export const searchInput = style({
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

export const searchInputSplash = style({
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
  },
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.06)',
      borderColor: 'rgba(0,0,0,0.15)',
      '::placeholder': {
        color: 'rgba(0,0,0,0.45)'
      },
      ':focus': {
        borderColor: 'rgba(0,0,0,0.35)'
      }
    }
  }
});

export const scrollArea = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  paddingBottom: '16px'
});

export const groupHeading = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.5)',
  paddingBottom: '4px'
});

export const groupHeadingSplash = style({
  margin: 0,
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.5)',
  paddingBottom: '4px',
  '@media': {
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.5)'
    }
  }
});

export const paletteGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

const rowPadding = '10px 12px';
const rowMinHeight = '44px';
const rowFontSize = '14px';
const rowLineHeight = 1.4;

export const commandButton = style({
  appearance: 'none',
  width: '100%',
  minHeight: rowMinHeight,
  padding: rowPadding,
  fontSize: rowFontSize,
  lineHeight: rowLineHeight,
  textAlign: 'left',
  color: 'inherit',
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 2
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255,255,255,0.08)'
      }
    }
  }
});

export const commandButtonSplash = style({
  appearance: 'none',
  width: '100%',
  minHeight: rowMinHeight,
  padding: rowPadding,
  fontSize: rowFontSize,
  lineHeight: rowLineHeight,
  textAlign: 'left',
  color: 'inherit',
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.5)',
    outlineOffset: 2
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        background: 'rgba(255,255,255,0.08)'
      }
    },
    '(prefers-color-scheme: light)': {
      ':focus-visible': {
        outlineColor: 'rgba(0,0,0,0.4)'
      },
      ':hover': {
        background: 'rgba(0,0,0,0.06)'
      }
    }
  }
});

export const commandButtonActive = style({
  background: 'rgba(255,255,255,0.12)'
});

export const commandButtonActiveSplash = style({
  background: 'rgba(255,255,255,0.12)',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.08)'
    }
  }
});

export const switchRowActive = style({
  background: 'rgba(255,255,255,0.12)',
  borderRadius: '4px'
});

export const switchRowActiveSplash = style({
  background: 'rgba(255,255,255,0.12)',
  borderRadius: '4px',
  '@media': {
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.08)'
    }
  }
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
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

export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  minHeight: rowMinHeight,
  padding: rowPadding,
  fontSize: rowFontSize,
  lineHeight: rowLineHeight,
  boxSizing: 'border-box',
  borderRadius: '4px'
});

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

export const closeBtnCorner = style({
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

export const closeBtnCornerSplash = style({
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
    },
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.4)',
      ':focus-visible': {
        outlineColor: 'rgba(0,0,0,0.4)'
      },
      ':hover': {
        background: 'rgba(0,0,0,0.06)',
        color: 'rgba(0,0,0,0.8)'
      }
    }
  }
});
