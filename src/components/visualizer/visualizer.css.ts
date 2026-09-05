import {style} from '@vanilla-extract/css';

export const canvas = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 0,
  width: '100vw',
  height: '100vh',
  objectFit: 'contain',
  objectPosition: 'center',
  background: '#000',
  display: 'block',
  border: 'none',
  cursor: 'inherit',
  // Keep touch drags feeding the warp interaction instead of triggering browser pan and zoom.
  touchAction: 'none'
});
