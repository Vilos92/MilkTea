import type {OutputFormat} from 'mediabunny';
import {AudioBufferSource, BufferTarget, CanvasSource, Output} from 'mediabunny';

import {createVisualizer, createVisualizerAudioContext} from '../lib/butterchurn/butterchurn';
import type {Visualizer} from '../lib/butterchurn/butterchurn';
import {fetchPresetByIndex} from '../lib/butterchurn/butterchurnPresets';
import {computeVideoBitrate} from '../lib/video';
import type {RenderConfig, VideoFormatId} from '../lib/video';
import type {ExportJob, ExportJobCallbacks} from './offlineExportTypes';
import {createAudioLevels, fillAudioLevels, nextAnimationFrame} from './offlineExportUtils';
import type {AudioLevels} from './offlineExportUtils';

const AUDIO_BITRATE = 192_000;
const RENDER_SLICE_MS = 100;

type ExportSession = {
  target: BufferTarget;
  format: OutputFormat;
  output: Output;
  videoSource: CanvasSource;
  audioSource: AudioBufferSource;
  visualizer: Visualizer;
  audioLevels: AudioLevels;
};

type ExportRendererOptions = ExportJobCallbacks & {
  job: ExportJob;
  canvas: HTMLCanvasElement;
  audioBuffer: AudioBuffer;
  presetIndex: number;
  renderConfig: RenderConfig;
  createOutputFormat: (formatId: VideoFormatId) => OutputFormat;
};

type FrameSliceResult = {isActive: boolean; lastYieldTime: number};

export function renderOfflineExport(options: ExportRendererOptions): Promise<void> {
  return renderActiveExport(options)
    .catch(error => handleExportError(options, error))
    .finally(() => finishCancelledExport(options));
}

async function renderActiveExport(options: ExportRendererOptions): Promise<void> {
  const session = await prepareExportSession(options);
  if (!session || !canContinue(options)) {
    return;
  }
  await renderExport(options, session);
  await completeExport(options, session);
}

async function finishCancelledExport(options: ExportRendererOptions): Promise<void> {
  if (options.job.isCancelled) {
    await options.finishCancelledJob(options.job);
  }
}

async function prepareExportSession(options: ExportRendererOptions): Promise<ExportSession | undefined> {
  const {canvas, job, presetIndex, renderConfig} = options;
  const preset = await fetchPresetByIndex(presetIndex);
  if (!canContinue(options)) {
    return undefined;
  }

  const target = new BufferTarget();
  const format = options.createOutputFormat(renderConfig.formatId);
  const output = new Output({format, target});
  const {videoCodec, audioCodec} = selectCodecs(renderConfig.formatId);
  const videoSource = createVideoSource(canvas, renderConfig, videoCodec);
  const audioSource = new AudioBufferSource({codec: audioCodec, bitrate: AUDIO_BITRATE});
  const context = createVisualizerAudioContext();
  job.output = output;
  job.audioContext = context.audioContext;
  if (!canContinue(options)) {
    return undefined;
  }

  output.addVideoTrack(videoSource);
  output.addAudioTrack(audioSource);
  canvas.width = renderConfig.width;
  canvas.height = renderConfig.height;
  return {
    target,
    format,
    output,
    videoSource,
    audioSource,
    visualizer: createVisualizer(canvas, context, preset, renderConfig.width, renderConfig.height),
    audioLevels: createAudioLevels()
  };
}

async function renderExport(options: ExportRendererOptions, session: ExportSession): Promise<void> {
  await session.output.start();
  if (!canContinue(options)) {
    return;
  }

  options.setState('rendering');
  await renderFrames(options, session);
  if (!canContinue(options)) {
    return;
  }

  options.setState('finishing');
  await session.audioSource.add(options.audioBuffer);
  if (!canContinue(options)) {
    return;
  }

  await session.output.finalize();
}

async function renderFrames(options: ExportRendererOptions, session: ExportSession): Promise<void> {
  const frameDuration = 1 / options.renderConfig.fps;
  const totalFrames = Math.ceil(options.audioBuffer.duration * options.renderConfig.fps);
  let lastYieldTime = performance.now();
  let isActive = true;

  for (let frame = 0; frame < totalFrames && isActive; frame += 1) {
    const result = await renderFrameSlice(options, session, frame, frameDuration, totalFrames, lastYieldTime);
    isActive = result.isActive;
    lastYieldTime = result.lastYieldTime;
  }
}

async function renderFrameSlice(
  options: ExportRendererOptions,
  session: ExportSession,
  frame: number,
  frameDuration: number,
  totalFrames: number,
  lastYieldTime: number
): Promise<FrameSliceResult> {
  if (!canContinue(options)) {
    return {isActive: false, lastYieldTime};
  }

  await renderFrame(session, options.audioBuffer, frame, frameDuration);
  if (!shouldYield(frame, totalFrames, lastYieldTime)) {
    return {isActive: canContinue(options), lastYieldTime};
  }
  if (!canContinue(options)) {
    return {isActive: false, lastYieldTime};
  }

  options.setProgress((frame + 1) / totalFrames);
  await nextAnimationFrame();
  return {isActive: canContinue(options), lastYieldTime: performance.now()};
}

async function renderFrame(
  session: ExportSession,
  audioBuffer: AudioBuffer,
  frame: number,
  frameDuration: number
): Promise<void> {
  const timestamp = frame * frameDuration;
  const duration = Math.min(frameDuration, audioBuffer.duration - timestamp);
  fillAudioLevels(audioBuffer, timestamp, session.audioLevels);
  session.visualizer.render({audioLevels: session.audioLevels, elapsedTime: frameDuration});
  await session.videoSource.add(timestamp, duration);
}

async function completeExport(options: ExportRendererOptions, session: ExportSession): Promise<void> {
  if (!canContinue(options)) {
    return;
  }

  await options.closeJobContext(options.job);
  if (!canContinue(options)) {
    return;
  }

  const {baseName} = options.renderConfig;
  options.onProcessed(
    new Blob([session.target.buffer!], {type: session.format.mimeType}),
    `${baseName}${session.format.fileExtension}`
  );
  await options.finishJob(options.job, 'idle');
}

async function handleExportError(options: ExportRendererOptions, error: unknown): Promise<void> {
  if (!canContinue(options)) {
    return;
  }

  console.error(error);
  try {
    await options.teardownJob(options.job);
  } catch (teardownError) {
    console.error(teardownError);
  }
  await options.finishJob(options.job, 'error');
}

function canContinue({job, isActiveJob}: ExportRendererOptions): boolean {
  return isActiveJob(job) && !job.isCancelled;
}

function createVideoSource(
  canvas: HTMLCanvasElement,
  {width, height, fps, bpp}: RenderConfig,
  codec: 'avc' | 'vp9'
): CanvasSource {
  return new CanvasSource(canvas, {
    codec,
    bitrate: computeVideoBitrate(width, height, fps, bpp),
    latencyMode: 'quality',
    hardwareAcceleration: 'prefer-hardware'
  });
}

function selectCodecs(formatId: VideoFormatId) {
  return formatId === 'webm'
    ? {videoCodec: 'vp9' as const, audioCodec: 'opus' as const}
    : {videoCodec: 'avc' as const, audioCodec: 'aac' as const};
}

function shouldYield(frame: number, totalFrames: number, lastYieldTime: number): boolean {
  return performance.now() - lastYieldTime >= RENDER_SLICE_MS || frame === totalFrames - 1;
}
