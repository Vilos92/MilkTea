import type {RefObject} from 'preact';

import {canvas} from './visualizer.css.ts';
import {VisualizerOverlay} from './visualizerOverlay';

/*
 * Types.
 */

type VisualizerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  presetName: string | undefined;
  trackName: string | undefined;
};

/*
 * Component.
 */

export function Visualizer({canvasRef, presetName, trackName}: VisualizerProps) {
  return (
    <>
      <canvas ref={canvasRef} class={canvas} aria-label="Visualizer" />
      <VisualizerOverlay presetName={presetName} trackName={trackName} />
    </>
  );
}
