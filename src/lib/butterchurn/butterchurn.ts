// @ts-expect-error - no types
import butterchurn from 'butterchurn';

/*
 * Types.
 */

export type Visualizer = ReturnType<typeof butterchurn.default.createVisualizer>;

export type VisualizerContext = {
  audioContext: AudioContext;
  gainNode: GainNode;
};

/*
 * Helpers.
 */

/**
 * Creates a butterchurn Visualizer instance.
 * NOTE: The Visualizer is not responsible for setting the outer canvas dimensions.
 */
export function createVisualizer(
  canvas: HTMLCanvasElement,
  context: VisualizerContext,
  preset: unknown,
  width: number,
  height: number
): Visualizer {
  const {audioContext, gainNode} = context;

  const factory = butterchurn.default;

  const visualizer: Visualizer = factory.createVisualizer(audioContext, canvas, {
    width,
    height,
    pixelRatio: window.devicePixelRatio ?? 1
  });

  visualizer.loadPreset(preset, 0);
  visualizer.connectAudio(gainNode);

  return visualizer;
}

/**
 * Create a visualizer context with an oscillator and gain node.
 * The oscillator is only used to feed the gain node for the visualizer.
 * There is no connection to the destination (no audio output).
 */
export function createOscillatorVisualizerContext(): VisualizerContext {
  const AudioContextClass = window.AudioContext;

  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = 60;
  gain.gain.value = 0.1;
  osc.connect(gain);
  osc.start();

  return {audioContext: ctx, gainNode: gain};
}
