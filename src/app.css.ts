import {style} from '@vanilla-extract/css';

export const root = style({
  background: '#000',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white'
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

export const btnFullscreen = style([
  btn,
  {
    background: '#444'
  }
]);

export const controls = style({
  position: 'fixed',
  top: '20px',
  zIndex: 100,
  display: 'flex',
  gap: '10px'
});
