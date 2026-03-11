/*
 * Types.
 */

export const AudioSource = {
  OSCILLATOR: 'oscillator',
  FILE: 'file',
  MICROPHONE: 'microphone'
} as const;
export type AudioSource = (typeof AudioSource)[keyof typeof AudioSource];

export type AudioFilePlayback = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
};
