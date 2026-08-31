import {style} from '@vanilla-extract/css';

/*
 * Styles.
 */

export const splashOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
});

export const previewLabel = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'rgba(255, 255, 255, 0.12)',
  fontSize: '20px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  pointerEvents: 'none',
  userSelect: 'none'
});
