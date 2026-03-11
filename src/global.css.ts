import {globalStyle} from '@vanilla-extract/css';

globalStyle(':root', {
  backgroundColor: '#000',
  colorScheme: 'dark'
});

globalStyle('body', {
  fontFamily: "ui-monospace, 'SF Mono', monospace"
});

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit'
});
