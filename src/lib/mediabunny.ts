import {
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  MkvOutputFormat,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  OutputFormat,
  WEBM,
  WebMOutputFormat
} from 'mediabunny';

/*
 * Types.
 */

export type VideoOutputFormat = OutputFormat;

export type VideoFormatOption = {label: string; format: VideoOutputFormat};

/*
 * Constants.
 */

export const VIDEO_FORMAT_OPTIONS: readonly VideoFormatOption[] = [
  {label: 'MP4', format: new Mp4OutputFormat()},
  {label: 'MOV', format: new MovOutputFormat()},
  {label: 'MKV', format: new MkvOutputFormat()},
  {label: 'WebM', format: new WebMOutputFormat()}
];

/*
 * Helpers.
 */

/**
 * Converts a WebM blob to another container format using Mediabunny.
 * The input blob is assumed to come from `MediaRecorder` (VP8/VP9-encoded WebM).
 */
export async function convertWebmToFormat(
  webmBlob: Blob,
  format: VideoOutputFormat,
  videoBitrate: number
): Promise<Blob> {
  const target = new BufferTarget();
  const conversion = await Conversion.init({
    input: new Input({formats: [WEBM], source: new BlobSource(webmBlob)}),
    output: new Output({format, target}),
    video: {bitrate: videoBitrate},
    showWarnings: false
  });
  await conversion.execute();
  return new Blob([target.buffer!], {type: format.mimeType});
}
