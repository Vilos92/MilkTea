/*
 * Types.
 */

/** Describes the captured stream to the processor, which never matches the context rate. */
export type PcmPlayerOptions = {
  captureSampleRate: number;
  captureChannelCount: number;
};

/** Hands one chunk of interleaved `f32` frames to a running PCM player node. */
export type PcmSink = (samples: Float32Array<ArrayBuffer>) => void;

/*
 * Constants.
 */

/** Name `pcmPlayerWorklet.ts` registers the processor under. */
export const PCM_PLAYER_PROCESSOR_NAME = 'pcm-player';

/** Tells the processor to release itself, so a disconnected node does not render forever. */
export const PCM_PLAYER_STOP_MESSAGE = 'stop';

/** Output channels the processor always produces, so mono captures still fill the analysis graph. */
export const PCM_PLAYER_OUTPUT_CHANNEL_COUNT = 2;
