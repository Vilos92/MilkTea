import type {RefObject} from 'preact';

import {Visualizer} from './visualizer';
import {VisualizerOverlay} from './visualizerOverlay';

/*
 * Types.
 */

type VisualizerStageProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  presetName: string | undefined;
  trackName: string | undefined;
};

/*
 * Component.
 */

export function VisualizerStage({canvasRef, presetName, trackName}: VisualizerStageProps) {
  return (
    <>
      <Visualizer canvasRef={canvasRef} />
      <VisualizerOverlay presetName={presetName} trackName={trackName} />
    </>
  );
}
