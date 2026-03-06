import {style} from '@vanilla-extract/css';

export const topCorner = style({
  position: 'fixed',
  zIndex: 300,
  transition: 'opacity 0.35s ease'
});

export const topLeftCorner = style({
  top: '12px',
  left: '12px'
});

export const topRightCorner = style({
  top: '12px',
  right: '12px'
});

export const hudVisible = style({
  opacity: 1
});

export const hudFaded = style({
  opacity: 0,
  pointerEvents: 'none'
});
