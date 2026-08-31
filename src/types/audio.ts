/*
 * Types.
 */

export type AudioSource = (typeof AudioSource)[keyof typeof AudioSource];

export type AudioFilePlayback = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
};

/*
 * Enums.
 */

export const AudioSource = {
  OSCILLATOR: 'oscillator',
  FILE: 'file',
  MICROPHONE: 'microphone',
  SCREEN_CAPTURE: 'screen-capture'
} as const;
