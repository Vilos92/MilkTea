const AUDIO_SAMPLE_COUNT = 1024;

export type AudioLevels = {
  timeByteArray: Uint8Array;
  timeByteArrayL: Uint8Array;
  timeByteArrayR: Uint8Array;
};

export function createAudioLevels(): AudioLevels {
  return {
    timeByteArray: new Uint8Array(AUDIO_SAMPLE_COUNT),
    timeByteArrayL: new Uint8Array(AUDIO_SAMPLE_COUNT),
    timeByteArrayR: new Uint8Array(AUDIO_SAMPLE_COUNT)
  };
}

export function fillAudioLevels(audioBuffer: AudioBuffer, time: number, audioLevels: AudioLevels): void {
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(Math.min(1, audioBuffer.numberOfChannels - 1));
  const endSample = Math.floor(time * audioBuffer.sampleRate);

  for (let index = 0; index < AUDIO_SAMPLE_COUNT; index += 1) {
    const sampleIndex = endSample - AUDIO_SAMPLE_COUNT + index;
    const leftSample = left[sampleIndex] ?? 0;
    const rightSample = right[sampleIndex] ?? 0;
    audioLevels.timeByteArray[index] = encodeAudioSample((leftSample + rightSample) / 2);
    audioLevels.timeByteArrayL[index] = encodeAudioSample(leftSample);
    audioLevels.timeByteArrayR[index] = encodeAudioSample(rightSample);
  }
}

export function nextAnimationFrame(): Promise<void> {
  const {promise, resolve} = Promise.withResolvers<void>();
  requestAnimationFrame(() => resolve());
  return promise;
}

function encodeAudioSample(sample: number): number {
  return Math.round(Math.max(-1, Math.min(1, sample)) * 127 + 128);
}
