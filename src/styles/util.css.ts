import {style} from '@vanilla-extract/css';

/** Visually hidden but accessible to screen readers. */
export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0
});

/** Generic faded-out state for opacity transitions. */
export const faded = style({
  opacity: 0
});
