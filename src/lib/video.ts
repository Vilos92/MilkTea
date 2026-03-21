import type {Size} from '../types/geometry';
import {clamp} from './number';

/*
 * Types.
 */

export type VideoQualityLabel = 'Low' | 'Medium' | 'High' | 'Ultra';
export type VideoQualityPreset = {label: VideoQualityLabel; bpp: number};

export type VideoSizeLabel = '1080p' | '4K' | 'Square' | 'Vertical';
export type VideoSizePreset = {label: VideoSizeLabel; width: number; height: number};

export type VideoFormatId = 'mp4' | 'mov' | 'mkv' | 'webm';
export type VideoFormatOption = {id: VideoFormatId; label: string};

/*
 * Constants.
 */

export const MIN_VIDEO_DIMENSION = 1;
export const MAX_VIDEO_DIMENSION = 3840;

export const MIN_VIDEO_FPS = 1;
export const MAX_VIDEO_FPS = 120;
export const DEFAULT_VIDEO_FPS = 60;

/** When fitting a large render into UI, neither side exceeds this (CSS px). */
export const MAX_VIDEO_PREVIEW_DISPLAY_PX = 480;

export const VIDEO_QUALITY_PRESETS: readonly VideoQualityPreset[] = [
  {label: 'Low', bpp: 0.05},
  {label: 'Medium', bpp: 0.1},
  {label: 'High', bpp: 0.15},
  {label: 'Ultra', bpp: 0.2}
] as const;

export const VIDEO_SIZE_PRESETS: readonly VideoSizePreset[] = [
  {label: '1080p', width: 1920, height: 1080},
  {label: '4K', width: 3840, height: 2160},
  {label: 'Square', width: 1080, height: 1080},
  {label: 'Vertical', width: 1080, height: 1920}
] as const;

/** Output container options for post-capture conversion (WebM -> target). */
export const VIDEO_FORMAT_OPTIONS: readonly VideoFormatOption[] = [
  {id: 'mp4', label: 'MP4'},
  {id: 'mov', label: 'MOV'},
  {id: 'mkv', label: 'MKV'},
  {id: 'webm', label: 'WebM'}
];

/** First entry in {@link VIDEO_SIZE_PRESETS} (1080p). */
export const DEFAULT_VIDEO_SIZE_PRESET: VideoSizePreset = VIDEO_SIZE_PRESETS[0];

/** Main-app recording bpp (same value as the "High" quality preset). */
export const DEFAULT_MAIN_RECORD_BPP: number = VIDEO_QUALITY_PRESETS.find(p => p.label === 'High')!.bpp;

/*
 * Helpers.
 */

/** Width/height only for `resizeCanvas`, `RenderConfig`, etc. */
export function sizeFromVideoPreset(preset: VideoSizePreset): Size {
  return {width: preset.width, height: preset.height};
}

/** Computes a target video bitrate in bits per second from pixel dimensions and quality settings. */
export function computeVideoBitrate(width: number, height: number, fps: number, bpp: number): number {
  return Math.round(width * height * fps * bpp);
}

export function clampVideoDimension(dimension: number): number {
  const v = Number.isNaN(dimension) ? MIN_VIDEO_DIMENSION : Math.round(dimension);
  return clamp(v, MIN_VIDEO_DIMENSION, MAX_VIDEO_DIMENSION);
}

export function clampVideoFps(fps: number): number {
  const v = Number.isNaN(fps) ? MIN_VIDEO_FPS : Math.round(fps);
  return clamp(v, MIN_VIDEO_FPS, MAX_VIDEO_FPS);
}

/**
 * Scales a logical render size down for on-screen preview so neither side exceeds `maxDisplayPx`, and
 * (unless already smaller). Preserves aspect ratio.
 */
export function scaleVideoSizeToMaxDisplay(
  size: Size,
  maxDisplayPx: number = MAX_VIDEO_PREVIEW_DISPLAY_PX
): Size {
  const scale = Math.min(maxDisplayPx / size.width, maxDisplayPx / size.height, 1);
  return {width: Math.round(size.width * scale), height: Math.round(size.height * scale)};
}
