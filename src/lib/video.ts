/*
 * Helpers.
 */

/** Computes a target video bitrate in bits per second from pixel dimensions and quality settings. */
export function computeVideoBitrate(width: number, height: number, fps: number, bpp: number): number {
  return Math.round(width * height * fps * bpp);
}
