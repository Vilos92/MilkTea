import type {RefObject} from 'preact';

import {canvas} from './visualizer.css.ts';

type VisualizerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
};

export const Visualizer = ({canvasRef}: VisualizerProps) => {
  return <canvas ref={canvasRef} class={canvas} aria-label="Visualizer" />;
};
