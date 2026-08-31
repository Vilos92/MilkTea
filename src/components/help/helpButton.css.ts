import {style} from '@vanilla-extract/css';

import {
  iconButton,
  iconButtonActive,
  iconButtonAlwaysLight,
  iconButtonAlwaysLightActive
} from '../hud/hud.css';

/*
 * Styles.
 */

export const helpButtonRoot = style({
  display: 'flex',
  alignItems: 'center'
});

export const helpButton = iconButton;
export const helpButtonActive = iconButtonActive;
export const helpButtonAlwaysLight = iconButtonAlwaysLight;
export const helpButtonAlwaysLightActive = iconButtonAlwaysLightActive;
