import {style} from '@vanilla-extract/css';

/** Strip default `<button>` chrome; consumer classes supply layout and visuals. */
export const chromeless = style({
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  margin: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent'
});
