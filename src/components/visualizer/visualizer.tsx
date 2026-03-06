import type {RefObject} from 'preact';

import {canvas} from './visualizer.css.ts';

/*
 * Types.
 */

type VisualizerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
};

/*
 * Component.
 */

export const Visualizer = ({canvasRef}: VisualizerProps) => {
  return <canvas ref={canvasRef} class={canvas} aria-label="Visualizer" />;
};
