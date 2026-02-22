import {style} from '@vanilla-extract/css';

export const canvas = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 0,
  width: '100vw',
  height: '100vh',
  background: '#000',
  display: 'block',
  border: 'none',
  cursor: 'default'
});

export const canvasHideCursor = style({
  cursor: 'none'
});
