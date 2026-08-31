import type {RefObject} from 'preact';
import {useRef, useState} from 'preact/hooks';

import {formatTime} from '../../lib/formatTime';
import {useTranslate} from '../../providers/translation';
import type {AudioFilePlayback} from '../../types/audio';

import {
  progressBarInner,
  progressFill,
  progressTrack,
  progressTrackDragging,
  progressWrap,
  timeLabel,
  timeLabelRight
} from './controls.css';

type PlaybackProgressProps = {
  filePlayback: AudioFilePlayback;
  recordProgress: number | undefined;
  onControlsEnter: () => void;
  onDragChange: (isDragging: boolean) => void;
};

export function PlaybackProgress({
  filePlayback,
  recordProgress,
  onControlsEnter,
  onDragChange
}: PlaybackProgressProps) {
  if (recordProgress !== undefined) {
    return <ExportProgress duration={filePlayback.duration} progress={recordProgress} />;
  }
  if (filePlayback.duration <= 0) {
    return null;
  }

  return (
    <SeekProgress filePlayback={filePlayback} onControlsEnter={onControlsEnter} onDragChange={onDragChange} />
  );
}

function ExportProgress({duration, progress}: {duration: number; progress: number}) {
  const t = useTranslate();
  return (
    <div class={progressWrap}>
      <span class={timeLabel}>{formatTime(duration * progress)}</span>
      <div
        class={progressTrack}
        role="progressbar"
        aria-label={t('controls.processingRecord')}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={progress}
      >
        <div class={progressBarInner}>
          <div class={progressFill} style={{width: `${progress * 100}%`}} />
        </div>
      </div>
      <span class={[timeLabel, timeLabelRight].join(' ')}>{formatTime(duration)}</span>
    </div>
  );
}

function SeekProgress({
  filePlayback,
  onControlsEnter,
  onDragChange
}: {
  filePlayback: AudioFilePlayback;
  onControlsEnter: () => void;
  onDragChange: (isDragging: boolean) => void;
}) {
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const onSeekRef = useRef(filePlayback.onSeek);
  onSeekRef.current = filePlayback.onSeek;
  const trackDurationRef = useRef(filePlayback.duration);
  trackDurationRef.current = filePlayback.duration;
  const setDragging = (isDragging: boolean) => {
    setIsDragging(isDragging);
    onDragChange(isDragging);
  };

  const seekFromClientX = (clientX: number) => {
    const element = progressTrackRef.current;
    const onSeek = onSeekRef.current;
    const duration = trackDurationRef.current;
    if (!element || !onSeek || duration <= 0) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    onSeek((x / rect.width) * duration);
  };

  return (
    <ProgressSlider
      duration={filePlayback.duration}
      currentTime={filePlayback.currentTime}
      onSeek={filePlayback.onSeek}
      onControlsEnter={onControlsEnter}
      isDragging={isDragging}
      setIsDragging={setDragging}
      progressTrackRef={progressTrackRef}
      seekFromClientX={seekFromClientX}
    />
  );
}

type ProgressSliderProps = {
  duration: number;
  currentTime: number;
  onSeek: ((time: number) => void) | undefined;
  onControlsEnter: () => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  progressTrackRef: RefObject<HTMLDivElement>;
  seekFromClientX: (clientX: number) => void;
};

function ProgressSlider({
  duration,
  currentTime,
  onSeek,
  onControlsEnter,
  isDragging,
  setIsDragging,
  progressTrackRef,
  seekFromClientX
}: ProgressSliderProps) {
  const onMouseDown = (event: MouseEvent) => {
    if (!onSeek || duration <= 0) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
    document.documentElement.style.cursor = 'grabbing';
    seekFromClientX(event.clientX);
    addMouseDragListeners(seekFromClientX, onControlsEnter, () => setIsDragging(false));
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!onSeek || duration <= 0) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
    seekFromClientX(event.touches[0].clientX);
    addTouchDragListeners(seekFromClientX, onControlsEnter, () => setIsDragging(false));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!onSeek) {
      return;
    }
    if (event.key === 'ArrowRight') {
      onSeek(Math.min(currentTime + 5, duration));
    }
    if (event.key === 'ArrowLeft') {
      onSeek(Math.max(currentTime - 5, 0));
    }
  };

  return (
    <div class={progressWrap}>
      <span class={timeLabel}>{formatTime(currentTime)}</span>
      <div
        ref={progressTrackRef}
        class={isDragging ? [progressTrack, progressTrackDragging].join(' ') : progressTrack}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onKeyDown={onKeyDown}
      >
        <div class={progressBarInner}>
          <div class={progressFill} style={{width: `${Math.min((currentTime / duration) * 100, 100)}%`}} />
        </div>
      </div>
      <span class={[timeLabel, timeLabelRight].join(' ')}>{formatTime(duration)}</span>
    </div>
  );
}

function addMouseDragListeners(
  seekFromClientX: (clientX: number) => void,
  onControlsEnter: () => void,
  stopDragging: () => void
): void {
  const onMouseMove = (event: MouseEvent) => seekFromClientX(event.clientX);
  const onMouseUp = () => {
    stopDragging();
    onControlsEnter();
    document.documentElement.style.cursor = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function addTouchDragListeners(
  seekFromClientX: (clientX: number) => void,
  onControlsEnter: () => void,
  stopDragging: () => void
): void {
  const onTouchMove = (event: TouchEvent) => seekFromClientX(event.touches[0].clientX);
  const onTouchEnd = () => {
    stopDragging();
    onControlsEnter();
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  };
  document.addEventListener('touchmove', onTouchMove, {passive: false});
  document.addEventListener('touchend', onTouchEnd);
}
