import {style} from '@vanilla-extract/css';

import {iconButton, iconButtonAlwaysLight} from '../hud/hud.css';

/*
 * Styles.
 */

export const helpButtonRoot = style({
  display: 'flex',
  alignItems: 'center'
});

export const helpButton = iconButton;
export const helpButtonAlwaysLight = iconButtonAlwaysLight;
