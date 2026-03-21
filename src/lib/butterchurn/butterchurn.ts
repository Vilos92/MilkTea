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
 * Creates an `AudioContext` and master `GainNode` for Butterchurn (`connectAudio`).
 * The app must connect the active source (built-in oscillator, decoded file, mic, etc.) into `gainNode`.
 * Nothing is wired to `destination` here — monitoring is handled in the hook.
 */
export function createVisualizerAudioContext(): VisualizerContext {
  const AudioContextClass = window.AudioContext;

  const ctx = new AudioContextClass();
  const gain = ctx.createGain();
  gain.gain.value = 1.0;

  return {audioContext: ctx, gainNode: gain};
}
