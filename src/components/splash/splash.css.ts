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
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'light-dark(#171717, #fff)'
});

/** Transparent cutout sized to the button only. The dark overlay is box-shadow, the hole is the button area. */
export const splashCutout = style({
  boxShadow: '0 0 0 100vmax light-dark(#fff, #000)'
});

export const splashCutoutColumn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '32px',
  background: 'light-dark(#fff, #000)',
  boxShadow: '0 0 0 100vmax light-dark(#fff, #000)'
});

/** Reduced-motion: solid button so animation is not visible through it. */
export const btnSolid = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '280px',
  height: '96px',
  padding: 0,
  boxSizing: 'border-box',
  background: 'light-dark(#f7f7f7, #0a0a0a)',
  color: 'light-dark(#171717, #fff)',
  border: '1px solid light-dark(#333, rgba(255, 255, 255, 0.35))',
  borderRadius: 0,
  fontSize: '18px',
  fontWeight: 600,
  transition: 'none',
  ':active': {
    borderColor: 'light-dark(#111, rgba(255, 255, 255, 0.5))',
    boxShadow:
      '0 0 24px light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.2)), 0 0 48px light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))'
  },
  ':focus-visible': {
    borderColor: 'light-dark(#111, rgba(255, 255, 255, 0.5))',
    boxShadow: '0 0 0 2px light-dark(rgba(0, 0, 0, 0.25), rgba(255, 255, 255, 0.2))'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'light-dark(#555, rgba(255, 255, 255, 0.4))',
        boxShadow:
          '0 0 32px light-dark(rgba(0, 0, 0, 0.35), rgba(255, 255, 255, 0.4)), 0 0 64px light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.2))'
      }
    }
  }
});

/** Wrapper for disclaimer block in reduced-motion layout. */
export const splashDisclaimerBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
});

export const splashDisclaimer = style({
  margin: '0 20px',
  padding: '14px 18px',
  background: 'light-dark(rgba(255, 255, 255, 0.85), rgba(0, 0, 0, 0.85))',
  border: '1px solid light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.12))',
  borderRadius: 0,
  color: 'light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.88))',
  fontSize: '13px',
  lineHeight: 1.5,
  textAlign: 'center'
});

export const splashButtonContent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
});

export const splashTitleLine = style({
  display: 'block',
  minHeight: '1.2em',
  lineHeight: 1.2,
  textAlign: 'center'
});

export const splashSubtext = style({
  fontSize: '0.65em',
  fontWeight: 500,
  opacity: 0.9
});

/** Preference controls below the start button. */
export const splashPreferences = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '12px',
  marginTop: '24px'
});

/** Extra space above the disclaimer in the default splash layout. */
export const splashDisclaimerBelowPreferences = style({
  marginTop: '32px'
});

export const btn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '280px',
  height: '96px',
  padding: 0,
  boxSizing: 'border-box',
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: 0,
  fontSize: '18px',
  fontWeight: 600,
  textShadow: '0 0 12px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)',
  transition: 'border-color 0.15s ease, box-shadow 0.1s ease',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 24px rgba(255, 255, 255, 0.2), 0 0 48px rgba(255, 255, 255, 0.1)'
  },
  ':focus-visible': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
  },
  '@media': {
    '(hover: hover)': {
      ':hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        boxShadow: '0 0 32px rgba(255, 255, 255, 0.4), 0 0 64px rgba(255, 255, 255, 0.2)'
      }
    }
  }
});
