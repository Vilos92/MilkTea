import type {RefObject} from 'preact';

import {useTranslate} from '../../providers/translation';
import {
  audioSourceButton,
  audioSourceButtonActive,
  audioSourceButtonAlwaysLight,
  audioSourceButtonPending,
  audioSourceRoot
} from './audioSourceButtons.css.ts';

/*
 * Types.
 */

export const AudioSource = {
  OSCILLATOR: 'oscillator',
  FILE: 'file',
  MICROPHONE: 'microphone'
} as const;
export type AudioSource = (typeof AudioSource)[keyof typeof AudioSource];

type AudioSourceButtonsProps = {
  class?: string;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: Event) => void;
  audioSource: AudioSource;
  pendingAudioSource: AudioSource | undefined;
  started: boolean;
  onSourceChange: (source: AudioSource) => void;
};

/*
 * Component.
 */

export function AudioSourceButtons({
  class: className,
  fileInputRef,
  onFileChange,
  audioSource,
  pendingAudioSource,
  started,
  onSourceChange
}: AudioSourceButtonsProps) {
  const t = useTranslate();
  const rootClass = className ? [audioSourceRoot, className].join(' ') : audioSourceRoot;

  return (
    <div class={rootClass}>
      <input type="file" ref={fileInputRef} style="display:none" accept="audio/*" onChange={onFileChange} />
      <button
        type="button"
        class={buttonClass(AudioSource.OSCILLATOR, audioSource, pendingAudioSource, started)}
        onClick={() => onSourceChange(AudioSource.OSCILLATOR)}
        aria-label={t('source.oscillator')}
        aria-pressed={audioSource === AudioSource.OSCILLATOR}
        title={t('source.oscillator')}
      >
        〰️
      </button>
      <button
        type="button"
        class={buttonClass(AudioSource.FILE, audioSource, pendingAudioSource, started)}
        onClick={() => onSourceChange(AudioSource.FILE)}
        aria-label={t('source.file')}
        aria-pressed={audioSource === AudioSource.FILE}
        title={t('source.file')}
      >
        📼
      </button>
      <button
        type="button"
        class={buttonClass(AudioSource.MICROPHONE, audioSource, pendingAudioSource, started)}
        onClick={() => onSourceChange(AudioSource.MICROPHONE)}
        aria-label={t('source.microphone')}
        aria-pressed={audioSource === AudioSource.MICROPHONE}
        title={t('source.microphone')}
      >
        🎙️
      </button>
    </div>
  );
}

/*
 * Helpers.
 */

function buttonClass(
  source: AudioSource,
  activeSource: AudioSource,
  pendingSource: AudioSource | undefined,
  started: boolean
): string {
  const base = [audioSourceButton, started ? audioSourceButtonAlwaysLight : undefined]
    .filter(Boolean)
    .join(' ');
  if (pendingSource === source) {
    return [base, audioSourceButtonPending].join(' ');
  }
  if (activeSource === source) {
    return [base, audioSourceButtonActive].join(' ');
  }
  return base;
}
