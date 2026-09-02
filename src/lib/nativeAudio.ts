import {Channel, invoke} from '@tauri-apps/api/core';

import type {PcmSink} from './pcmPlayer';

/*
 * Types.
 */

/** Format of the stream the native capture opened. */
type SystemAudioStreamInfo = {
  sampleRate: number;
  channelCount: number;
};

/** Terminal notice from the backend: the stream died and will send no more frames. */
type SystemAudioFailure = {
  message: string;
};

export type SystemAudioCapture = {
  stop: () => Promise<void>;
};

/** Builds the sink that receives PCM once the capture format is known. */
type CreatePcmSink = (info: SystemAudioStreamInfo) => Promise<PcmSink>;

/*
 * Constants.
 */

const START_COMMAND = 'start_system_audio_capture';
const STOP_COMMAND = 'stop_system_audio_capture';

/*
 * Requests.
 */

/**
 * Starts native system-audio capture and routes its frames to a sink built from the reported
 * format. Rejects with the backend's message when the platform cannot capture system audio.
 *
 * `onTerminalError` fires when a stream that started successfully later dies on its own, for
 * example because the captured device disappeared. No frames follow it.
 *
 * Callers must check `supportsSystemAudioCapture` first: outside the desktop shell the command
 * does not exist.
 */
export async function startSystemAudioCapture(
  createSink: CreatePcmSink,
  onTerminalError: (message: string) => void
): Promise<SystemAudioCapture> {
  let sink: PcmSink | undefined;

  // Chunks that land before the sink exists are dropped. The player prebuffers before it starts
  // reading, so a few milliseconds of lead-in would never reach the analysis graph anyway.
  const channel = new Channel<ArrayBuffer | SystemAudioFailure>();
  channel.onmessage = message => {
    // Frames arrive as raw bytes. The backend reports a terminal failure as an object.
    if (message instanceof ArrayBuffer) {
      sink?.(new Float32Array(message));
      return;
    }
    onTerminalError(message.message);
  };

  const info = await invoke<SystemAudioStreamInfo>(START_COMMAND, {channel});

  try {
    sink = await createSink(info);
  } catch (error) {
    await stopSystemAudioCapture();
    throw error;
  }

  return {stop: stopSystemAudioCapture};
}

export function stopSystemAudioCapture(): Promise<void> {
  return invoke(STOP_COMMAND);
}
