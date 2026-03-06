import {style} from '@vanilla-extract/css';

export const commandPaletteButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  padding: 0,
  fontSize: '1.2rem',
  lineHeight: 1,
  background: 'transparent',
  color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '4px',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    },
    '(prefers-color-scheme: light)': {
      color: 'rgba(0,0,0,0.8)',
      border: '1px solid rgba(0,0,0,0.2)',
      ':focus-visible': {
        outline: '2px solid rgba(0,0,0,0.4)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(0,0,0,0.35)',
        background: 'rgba(0,0,0,0.06)'
      }
    },
    '(pointer: fine)': {
      width: '28px',
      height: '28px',
      fontSize: '1rem'
    }
  }
});

export const commandPaletteButtonActive = style({
  borderColor: 'rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.2)',
  '@media': {
    '(prefers-color-scheme: light)': {
      borderColor: 'rgba(0,0,0,0.5)',
      background: 'rgba(0,0,0,0.12)'
    }
  }
});

export const commandPaletteButtonAlwaysLight = style({
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(255,255,255,0.3)',
  ':focus-visible': {
    outline: '2px solid rgba(255,255,255,0.6)',
    outlineOffset: '2px'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    },
    '(prefers-color-scheme: light)': {
      background: 'rgba(0,0,0,0.5)',
      color: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(255,255,255,0.3)',
      ':focus-visible': {
        outline: '2px solid rgba(255,255,255,0.6)',
        outlineOffset: '2px'
      }
    },
    '(hover: hover) and (prefers-color-scheme: light)': {
      ':hover': {
        borderColor: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.1)'
      }
    }
  }
});

export const commandPaletteButtonAlwaysLightActive = style({
  borderColor: 'rgba(255,255,255,0.7)',
  background: 'rgba(255,255,255,0.25)',
  '@media': {
    '(prefers-color-scheme: light)': {
      borderColor: 'rgba(255,255,255,0.6)',
      background: 'rgba(255,255,255,0.3)'
    }
  }
});
