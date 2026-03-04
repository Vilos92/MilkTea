import {style} from '@vanilla-extract/css';

export const root = style({
  // Reset button defaults
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  // Ensure focus ring is visible when using keyboard
  ':focus-visible': {
    outline: '2px solid hsl(215 100% 50%)',
    outlineOffset: '2px',
    borderRadius: '9999px'
  },
  selectors: {
    '&[data-disabled]': {
      cursor: 'not-allowed',
      opacity: 0.5
    }
  }
});

export const track = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  width: '2.75rem', // 44px
  height: '1.5rem', // 24px
  borderRadius: '9999px',
  backgroundColor: 'hsl(240 5% 84%)',
  flexShrink: 0,

  selectors: {
    [`${root}[data-checked] &`]: {
      backgroundColor: 'hsl(222 47% 11%)'
    },
    [`${root}[data-disabled] &`]: {
      pointerEvents: 'none'
    },
    [`${root}:hover:not([data-disabled]) &`]: {
      backgroundColor: 'hsl(240 5% 78%)'
    },
    [`${root}:hover:not([data-disabled])[data-checked] &`]: {
      backgroundColor: 'hsl(222 47% 18%)'
    },
    [`${root}[data-disabled]:hover &`]: {
      backgroundColor: 'hsl(240 5% 78%)'
    },
    [`${root}[data-disabled][data-checked]:hover &`]: {
      backgroundColor: 'hsl(222 47% 18%)'
    }
  }
});

export const thumb = style({
  position: 'absolute',
  left: '0.1875rem', // 3px inset
  width: '1.125rem', // 18px
  height: '1.125rem',
  borderRadius: '9999px',
  backgroundColor: 'white',
  boxShadow: '0 1px 3px hsla(0,0%,0%,0.2), 0 1px 2px hsla(0,0%,0%,0.12)',

  selectors: {
    [`${root}[data-checked] &`]: {
      // travel = track width - thumb width - (2 * inset) = 44 - 18 - 6 = 20px
      transform: 'translateX(1.25rem)'
    }
  }
});

export const label = style({
  fontSize: '0.875rem',
  lineHeight: 1.5,
  color: 'hsl(240 6% 10%)',
  userSelect: 'none',

  selectors: {
    [`${root}[data-disabled] &`]: {
      color: 'hsl(240 4% 46%)'
    }
  }
});
