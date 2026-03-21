import type {VideoFormatId} from '../video';

/**
 * Converts a WebM blob to another container format using Mediabunny.
 * The input blob is assumed to come from `MediaRecorder` (VP8/VP9-encoded WebM).
 *
 * Dynamically imports the `mediabunny` package. This can be preloaded (see `preloadMediabunny`).
 */
export async function convertWebmToFormat(
  webmBlob: Blob,
  formatId: VideoFormatId,
  videoBitrate: number
): Promise<Blob> {
  const {
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    MkvOutputFormat,
    MovOutputFormat,
    Mp4OutputFormat,
    Output,
    WEBM,
    WebMOutputFormat
  } = await import('mediabunny');

  const format = (() => {
    switch (formatId) {
      case 'mp4':
        return new Mp4OutputFormat();
      case 'mov':
        return new MovOutputFormat();
      case 'mkv':
        return new MkvOutputFormat();
      case 'webm':
        return new WebMOutputFormat();
    }
  })();

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
