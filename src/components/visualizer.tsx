import type {RefObject} from 'preact';

import {canvas, canvasFullscreen, canvasFullscreenStarted, canvasWindowed} from './visualizer.css.ts';

/*
 * Types.
 */

export type DisplayMode = 'windowed' | 'fullscreen' | 'fullscreenStarted';

type VisualizerProps = {
  ref: RefObject<HTMLCanvasElement>;
  displayMode: DisplayMode;
  width: number;
  height: number;
};

/*
 * Styles.
 */

const modeClasses: Record<DisplayMode, string> = {
  windowed: [canvas, canvasWindowed].join(' '),
  fullscreen: [canvas, canvasFullscreen].join(' '),
  fullscreenStarted: [canvas, canvasFullscreen, canvasFullscreenStarted].join(' ')
};

/*
 * Component.
 */

export const Visualizer = ({ref, displayMode, width, height}: VisualizerProps) => {
  return <canvas ref={ref} class={modeClasses[displayMode]} width={width} height={height} />;
};
