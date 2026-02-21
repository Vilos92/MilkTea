import {style} from '@vanilla-extract/css';

export const canvas = style({
  background: '#000',
  display: 'block'
});

export const canvasWindowed = style({
  border: '1px solid #333',
  cursor: 'default',
  maxWidth: '90vw',
  maxHeight: '80vh'
});

export const canvasFullscreen = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  border: 'none',
  maxWidth: 'none',
  maxHeight: 'none'
});

export const canvasFullscreenStarted = style({
  cursor: 'none'
});
