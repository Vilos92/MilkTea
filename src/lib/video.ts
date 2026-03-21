import type {Size} from '../types/geometry';

/*
 * Constants.
 */

/** Fixed 16:9 output for the main app recording pipeline (MediaRecorder → Mediabunny). */
export const RECORDING_OUTPUT_SIZE_1080P: Size = {width: 1920, height: 1080};

/*
 * Helpers.
 */

/** Computes a target video bitrate in bits per second from pixel dimensions and quality settings. */
export function computeVideoBitrate(width: number, height: number, fps: number, bpp: number): number {
  return Math.round(width * height * fps * bpp);
}
