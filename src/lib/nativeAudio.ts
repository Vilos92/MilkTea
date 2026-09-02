import {Channel, invoke} from '@tauri-apps/api/core';

import type {PcmSink} from './pcmPlayer';

/*
 * Types.
 */

/** Native capture the desktop bus can open. Matches the Rust `CaptureSource` enum. */
export type NativeCaptureSource = (typeof NativeCaptureSource)[keyof typeof NativeCaptureSource];

/** Format of the stream the native capture opened. */
type CaptureStreamInfo = {
  sampleRate: number;
  channelCount: number;
};

/** Terminal notice from the backend: the stream died and will send no more frames. */
type CaptureFailure = {
  message: string;
};

export type NativeAudioCapture = {
  stop: () => Promise<void>;
};

/** Builds the sink that receives PCM once the capture format is known. */
type CreatePcmSink = (info: CaptureStreamInfo) => Promise<PcmSink>;

/*
 * Enums.
 */

export const NativeCaptureSource = {
  SYSTEM_AUDIO: 'systemAudio',
  MICROPHONE: 'microphone'
} as const;

/*
 * Constants.
 */

const START_COMMAND = 'start_audio_capture';
const STOP_COMMAND = 'stop_audio_capture';

/*
 * Requests.
 */

/**
 * Starts a native capture and routes its frames to a sink built from the reported format. Rejects
 * with the backend's message when the platform cannot open the requested source, and when a newer
 * start supersedes this one before its stream opens.
 *
 * `startToken` is a monotonic id the caller mints per dispatch. The backend installs the newest
 * token and the returned `stop` is scoped to it, so a stale start can never tear down a newer
 * source that shares this single backend session.
 *
 * `onTerminalError` fires when a stream that started successfully later dies on its own, for
 * example because the captured device disappeared. No frames follow it.
 *
 * Callers must check the matching capability predicate first: outside the desktop shell the command
 * does not exist.
 */
export async function startNativeCapture(
  source: NativeCaptureSource,
  startToken: number,
  createSink: CreatePcmSink,
  onTerminalError: (message: string) => void
): Promise<NativeAudioCapture> {
  let sink: PcmSink | undefined;

  // Chunks that land before the sink exists are dropped. The player prebuffers before it starts
  // reading, so a few milliseconds of lead-in would never reach the analysis graph anyway.
  const channel = new Channel<ArrayBuffer | CaptureFailure>();
  channel.onmessage = message => {
    // Frames arrive as raw bytes. The backend reports a terminal failure as an object.
    if (message instanceof ArrayBuffer) {
      sink?.(new Float32Array(message));
      return;
    }
    onTerminalError(message.message);
  };

  const info = await invoke<CaptureStreamInfo>(START_COMMAND, {source, channel, startToken});

  try {
    sink = await createSink(info);
  } catch (error) {
    await stopNativeCapture(startToken);
    throw error;
  }

  return {stop: () => stopNativeCapture(startToken)};
}

/**
 * Stops native capture. A `sessionId` scopes the stop to the session that token installed, so it
 * no-ops against a newer source. Passing `undefined` stops whatever runs, which the unload path
 * relies on.
 */
export function stopNativeCapture(sessionId: number | undefined): Promise<void> {
  return invoke(STOP_COMMAND, sessionId === undefined ? undefined : {sessionId});
}
