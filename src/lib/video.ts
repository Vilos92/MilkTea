import type {Size} from '../types/geometry';

/*
 * Helpers.
 */

/** Computes a target video bitrate in bits per second from pixel dimensions and quality settings. */
export function computeVideoBitrate(width: number, height: number, fps: number, bpp: number): number {
  return Math.round(width * height * fps * bpp);
}

/**
 * Scales a viewport size to a target pixel count (~2MP by default) while preserving aspect ratio.
 * Snaps both dimensions to even numbers (required by most video codecs).
 * Will not downscale if the viewport is already smaller than the target.
 */
export function computeRecordingSize(viewport: Size, targetPixels = 1920 * 1080): Size {
  const {width: vw, height: vh} = viewport;
  const aspectRatio = vw / vh;

  let height = Math.round(Math.sqrt(targetPixels / aspectRatio));
  let width = Math.round(height * aspectRatio);

  // Snap to even numbers (codec requirement).
  width = width % 2 === 0 ? width : width + 1;
  height = height % 2 === 0 ? height : height + 1;

  // Don't upscale past what butterchurn would be rendering anyway if viewport is tiny;
  // but DO allow upscaling on mobile since butterchurn re-renders at the new resolution.
  // Cap at 4K to stay reasonable.
  const MAX_DIMENSION = 3840;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    width = width % 2 === 0 ? width : width - 1;
    height = height % 2 === 0 ? height : height - 1;
  }

  return {width, height};
}
