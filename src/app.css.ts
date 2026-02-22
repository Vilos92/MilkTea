import {style} from '@vanilla-extract/css';

export const container = style({
  width: '100%',
  minHeight: '100vh',
  boxSizing: 'border-box',
  background: '#000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff'
});

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const overlayHideCursor = style({
  cursor: 'none'
});

export const btn = style({
  padding: '12px 24px',
  fontSize: '14px',
  background: '#222',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: '4px',
  cursor: 'pointer'
});
