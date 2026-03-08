import {style} from '@vanilla-extract/css';

export const container = style({
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  background: '#000',
  color: '#fff',
  padding: '32px',
  boxSizing: 'border-box'
});

export const canvasEl = style({
  display: 'block',
  background: '#000'
});

export const progressBarTrack = style({
  height: '3px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '9999px',
  overflow: 'hidden'
});

export const progressBarFill = style({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.55)',
  borderRadius: '9999px',
  transition: 'width 0.1s linear'
});

export const actionRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '44px'
});

export const btn = style({
  padding: '0 24px',
  height: '44px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderRadius: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
  ':focus-visible': {
    outline: 'none',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.15)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.5)'
      }
    }
  }
});

export const statusLabel = style({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.4)',
  letterSpacing: '0.04em'
});

export const downloadAnchor = style({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.55)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  transition: 'color 0.15s ease',
  '@media': {
    '(hover: hover)': {
      ':hover': {
        color: '#fff'
      }
    }
  }
});

export const btnRecord = style([
  btn,
  {
    borderColor: 'rgba(255, 80, 80, 0.45)',
    color: 'rgba(255, 120, 120, 1)',
    ':focus-visible': {
      outline: 'none',
      borderColor: 'rgba(255, 80, 80, 0.8)',
      boxShadow: '0 0 0 2px rgba(255, 80, 80, 0.15)'
    },
    '@media': {
      '(hover: hover)': {
        ':hover': {
          borderColor: 'rgba(255, 80, 80, 0.7)'
        }
      }
    }
  }
]);

export const recordingDot = style({
  display: 'inline-block',
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: 'rgba(255, 80, 80, 0.9)',
  marginRight: '8px',
  verticalAlign: 'middle',
  animation: 'none'
});

export const errorLabel = style({
  fontSize: '13px',
  color: 'rgba(255, 80, 80, 0.9)',
  maxWidth: '480px',
  textAlign: 'center',
  lineHeight: 1.5,
  margin: 0
});

export const qualityRow = style({
  display: 'flex'
});

export const qualityBtn = style({
  padding: '0 18px',
  height: '36px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: 0,
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.35)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  marginLeft: '-1px',
  transition: 'color 0.15s ease, border-color 0.15s ease',
  ':first-child': {marginLeft: 0},
  '@media': {
    '(hover: hover)': {
      ':hover': {
        color: 'rgba(255, 255, 255, 0.65)',
        borderColor: 'rgba(255, 255, 255, 0.35)'
      }
    }
  }
});

export const qualityBtnActive = style([
  qualityBtn,
  {
    color: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 1,
    position: 'relative'
  }
]);

export const setupForm = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px'
});

export const inputRow = style({
  display: 'flex',
  gap: '16px'
});

export const inputGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

export const inputLabel = style({
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.35)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
});

export const inputField = style({
  width: '96px',
  height: '44px',
  padding: '0 12px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderRadius: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  textAlign: 'center',
  ':focus-visible': {
    outline: 'none',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.15)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.5)'
      }
    }
  }
});
