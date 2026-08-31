import {globalStyle} from '@vanilla-extract/css';

/*
 * Styles.
 */

globalStyle(':root', {
  backgroundColor: 'light-dark(#fff, #000)',
  colorScheme: 'light dark'
});

globalStyle(':root[data-theme="light"]', {
  colorScheme: 'light'
});

globalStyle(':root[data-theme="dark"]', {
  colorScheme: 'dark'
});

globalStyle('body', {
  fontFamily: "ui-monospace, 'SF Mono', monospace"
});

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit'
});
