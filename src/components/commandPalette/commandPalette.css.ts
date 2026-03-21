import {style} from '@vanilla-extract/css';

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
  gap: '10px',
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
  gap: '10px',
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

/** Brief touch-press highlight for command rows; use as ChromelessButton `pressActiveClass` (dark palette). */
export const commandButtonTouchCoarse = style({
  '@media': {
    '(pointer: coarse)': {
      background: 'rgba(255,255,255,0.16) !important'
    }
  }
});

/** Same for adaptive (splash) palette. */
export const commandButtonTouchCoarseSplash = style({
  '@media': {
    '(pointer: coarse) and (prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.1) !important'
    },
    '(pointer: coarse) and (prefers-color-scheme: dark)': {
      background: 'rgba(255,255,255,0.16) !important'
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

/** Icon + label block so switch row labels align with command rows (same gap as commandButton). */
export const switchRowLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
});
