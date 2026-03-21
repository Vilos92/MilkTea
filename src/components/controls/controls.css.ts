import {globalStyle, keyframes, style} from '@vanilla-extract/css';

const pulseRing = keyframes({
  '0%': {boxShadow: '0 0 0 0 rgba(255, 195, 80, 0.5)'},
  '70%': {boxShadow: '0 0 0 6px rgba(255, 195, 80, 0)'},
  '100%': {boxShadow: '0 0 0 0 rgba(255, 195, 80, 0)'}
});

const recordPulse = keyframes({
  '0%, 100%': {opacity: 1},
  '50%': {opacity: 0.45}
});

/*
 * Shell.
 */

export const controls = style({
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '280px',
  minWidth: '280px',
  transition: 'opacity 0.35s ease',
  selectors: {
    '&:has(:focus-visible)': {
      opacity: '1 !important',
      pointerEvents: 'auto !important'
    } as Record<string, string>
  }
});

export const controlsStatic = style({
  position: 'relative',
  bottom: 'auto',
  left: 'auto',
  transform: 'none'
});

/*
 * Track info.
 */

export const trackInfo = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: '12px',
  opacity: 0.95
});

export const trackTitle = style({
  fontSize: '11px',
  color: '#fff',
  letterSpacing: '0.12em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '280px'
});

export const trackPresetLabel = style({
  fontSize: '10px',
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.08em'
});

globalStyle(`${trackInfo} ${trackPresetLabel}:not(:first-child)`, {
  marginTop: '2px'
});

/*
 * Progress bar.
 */

export const progressWrap = style({
  width: '100%',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const timeLabel = style({
  fontSize: '9px',
  color: 'rgba(255, 255, 255, 0.8)',
  letterSpacing: '0.05em',
  minWidth: '28px',
  userSelect: 'none'
});

export const timeLabelRight = style({
  textAlign: 'right'
});

export const progressTrack = style({
  flex: 1,
  height: '20px',
  background: 'transparent',
  position: 'relative',
  cursor: 'grab',
  userSelect: 'none',
  touchAction: 'none',
  '@media': {
    '(pointer: coarse)': {height: '28px'}
  }
});

export const progressBarInner = style({
  position: 'absolute',
  left: 0,
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  height: '3px',
  background: 'rgba(255, 255, 255, 0.22)',
  borderRadius: '2px',
  transition: 'height 0.15s, background 0.15s'
});

export const progressFill = style({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.88)',
  borderRadius: '2px',
  position: 'relative',
  pointerEvents: 'none',
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      right: '-4px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '8px',
      height: '8px',
      background: '#fff',
      borderRadius: '50%',
      opacity: 0,
      transition: 'opacity 0.15s'
    }
  }
});

globalStyle(`${progressTrack}:hover ${progressBarInner}`, {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      height: '5px',
      background: 'rgba(255, 255, 255, 0.35)'
    }
  }
});

globalStyle(`${progressTrack}:hover ${progressFill}::after`, {
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      opacity: 1
    }
  }
});

export const progressTrackDragging = style({
  cursor: 'grabbing'
});

globalStyle(`${progressTrackDragging} ${progressBarInner}`, {
  height: '5px',
  background: 'rgba(255, 255, 255, 0.35)'
});

globalStyle(`${progressTrackDragging} ${progressFill}::after`, {
  opacity: 1
});

/*
 * Row labels.
 */

export const rowLabel = style({
  fontSize: '8px',
  color: 'rgba(255, 255, 255, 0.6)',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  textAlign: 'center',
  marginBottom: '4px',
  marginTop: '8px',
  userSelect: 'none',
  selectors: {
    '&:first-of-type': {marginTop: 0}
  }
});

/*
 * Control rows.
 */

export const controlsRow = style({
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(22, 22, 22, 0.94)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '60px',
  padding: '6px 10px',
  transition: 'background 0.15s',
  '@media': {
    '(hover: hover) and (pointer: fine)': {':hover': {background: 'rgba(30, 30, 30, 0.97)'}}
  }
});

/*
 * Button variants.
 */

const btnShared: Parameters<typeof style>[0] = {
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'background 0.15s, color 0.15s, transform 0.1s',
  ':active': {transform: 'scale(0.92)'},
  ':focus-visible': {outline: '2px solid rgba(255, 255, 255, 0.4)', outlineOffset: '2px'}
};

/** Brief "pressed" state on mobile after tap; use with useMobilePressFeedback. */
export const mobileBtnActive = style({
  '@media': {
    '(pointer: coarse)': {
      background: 'rgba(255, 255, 255, 0.2) !important',
      color: '#fff !important',
      transform: 'scale(0.96)'
    }
  }
});

export const controlBtn = style({
  ...btnShared,
  width: '44px',
  height: '44px',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.92)',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      ':hover': {background: 'rgba(255, 255, 255, 0.15)', color: '#fff'}
    },
    '(pointer: coarse)': {width: '52px', height: '52px'}
  }
});

export const accentBtn = style({
  ...btnShared,
  width: '44px',
  height: '44px',
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#fff',
  '@media': {
    '(hover: hover) and (pointer: fine)': {':hover': {background: 'rgba(255, 255, 255, 0.2)'}},
    '(pointer: coarse)': {width: '52px', height: '52px'}
  }
});

export const recordBtn = style({
  ...btnShared,
  width: '44px',
  height: '44px',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.7)',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      ':hover': {color: 'rgba(255, 90, 90, 0.95)', background: 'rgba(255, 90, 90, 0.15)'}
    },
    '(pointer: coarse)': {width: '52px', height: '52px'}
  }
});

export const recordBtnActive = style({
  color: '#ff3333',
  animation: `${recordPulse} 1.4s ease-in-out infinite`
});

const recordProcessingPulse = keyframes({
  '0%, 100%': {opacity: 1},
  '50%': {opacity: 0.55}
});

export const recordBtnProcessing = style({
  color: 'rgba(255, 195, 80, 0.95)',
  background: 'rgba(255, 195, 80, 0.14)',
  cursor: 'wait',
  animation: `${recordProcessingPulse} 1.1s ease-in-out infinite`,
  selectors: {
    '&:disabled': {
      opacity: 1,
      color: 'rgba(255, 195, 80, 0.95)',
      background: 'rgba(255, 195, 80, 0.14)'
    }
  }
});

export const smallBtn = style({
  ...btnShared,
  width: '36px',
  height: '36px',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.92)',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      ':hover': {background: 'rgba(255, 255, 255, 0.15)', color: '#fff'}
    },
    '(pointer: coarse)': {width: '44px', height: '44px'}
  }
});

/*
 * Divider.
 */

export const divider = style({
  width: '1px',
  height: '20px',
  background: 'rgba(255, 255, 255, 0.08)',
  margin: '0 2px',
  flexShrink: 0
});

/*
 * Stage button.
 */

export const stageWrap = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const stageBtn = style({
  ...btnShared,
  width: '36px',
  height: '36px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.6)',
  transition: 'background 0.15s, color 0.15s, transform 0.1s, border-color 0.2s',
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      ':hover': {
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }
    },
    '(pointer: coarse)': {width: '44px', height: '44px'}
  }
});

export const stageBtnLoaded = style({
  borderColor: 'rgba(255, 195, 80, 0.6)',
  color: 'rgba(255, 195, 80, 0.9)',
  background: 'rgba(255, 195, 80, 0.08)',
  animation: `${pulseRing} 2s ease-out infinite`,
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      ':hover': {
        background: 'rgba(255, 195, 80, 0.15)',
        borderColor: 'rgba(255, 195, 80, 0.9)',
        color: '#ffc350'
      }
    }
  }
});
