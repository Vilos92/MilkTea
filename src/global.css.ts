import {globalStyle} from '@vanilla-extract/css';

globalStyle(':root', {
  backgroundColor: '#000',
  colorScheme: 'dark'
});

globalStyle('body', {
  margin: 0,
  minHeight: '100vh',
  width: '100%'
});

globalStyle('#app', {
  width: '100%',
  minHeight: '100vh'
});
