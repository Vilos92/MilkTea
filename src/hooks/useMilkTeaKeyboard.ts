import {useEffect} from 'preact/hooks';

import {AudioSource} from '../types/audio';
import type {AudioFilePlayback} from '../types/audio';

type UseMilkTeaKeyboardOptions = {
  started: boolean;
  audioSource: AudioSource;
  filePlayback: AudioFilePlayback | undefined;
  start: () => void;
  onRecord: () => void;
};

export function useMilkTeaKeyboard({
  started,
  audioSource,
  filePlayback,
  start,
  onRecord
}: UseMilkTeaKeyboardOptions): void {
  useStartKey(started, start);
  usePlaybackKey(started, filePlayback);
  useRecordKey(started, audioSource, onRecord);
}

function useStartKey(started: boolean, start: () => void): void {
  useEffect(() => {
    if (started) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        start();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, start]);
}

function usePlaybackKey(started: boolean, filePlayback: AudioFilePlayback | undefined): void {
  useEffect(() => {
    if (!started || !filePlayback) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      filePlayback.onPlayPause();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, filePlayback]);
}

function useRecordKey(started: boolean, audioSource: AudioSource, onRecord: () => void): void {
  useEffect(() => {
    if (!started || audioSource !== AudioSource.FILE) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => handleRecordKey(event, onRecord);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, audioSource, onRecord]);
}

function handleRecordKey(event: KeyboardEvent, onRecord: () => void): void {
  if (shouldIgnoreRecordKey(event)) {
    return;
  }
  event.preventDefault();
  onRecord();
}

function shouldIgnoreRecordKey(event: KeyboardEvent): boolean {
  return event.repeat || hasCommandModifier(event) || !isRecordKey(event) || isEditableTarget(event.target);
}

function hasCommandModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest?.('input, textarea') || element?.isContentEditable);
}

function isRecordKey(event: KeyboardEvent): boolean {
  return event.key === 'r' || event.key === 'R' || event.code === 'KeyR';
}
