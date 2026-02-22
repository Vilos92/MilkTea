import type {RefObject} from 'preact';

import {canvas, canvasHideCursor} from './visualizer.css.ts';

/*
 * Types.
 */

type VisualizerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  hideCursor?: boolean;
};

/*
 * Component.
 */

export const Visualizer = ({canvasRef, hideCursor = false}: VisualizerProps) => {
  const className = hideCursor ? [canvas, canvasHideCursor].join(' ') : canvas;
  return <canvas ref={canvasRef} class={className} />;
};
