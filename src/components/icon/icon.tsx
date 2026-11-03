import {Bluesky} from './paths/bluesky';
import {BookmarkCheck} from './paths/bookmarkCheck';
import {BookmarkPlus} from './paths/bookmarkPlus';
import {BrightnessIncrease} from './paths/brightnessIncrease';
import {ChartActivity2} from './paths/chartActivity2';
import {ChevronLeft} from './paths/chevronLeft';
import {ChevronMaximizeDiagonal} from './paths/chevronMaximizeDiagonal';
import {ChevronMinimizeDiagonal} from './paths/chevronMinimizeDiagonal';
import {ChevronRight} from './paths/chevronRight';
import {CircleQuestion} from './paths/circleQuestion';
import {ComputerSpeaker} from './paths/computerSpeaker';
import {FileMusic} from './paths/fileMusic';
import {Gear} from './paths/gear';
import {MediaNextFilled} from './paths/mediaNextFilled';
import {MediaPauseFilled} from './paths/mediaPauseFilled';
import {MediaPlayFilled} from './paths/mediaPlayFilled';
import {MediaPreviousFilled} from './paths/mediaPreviousFilled';
import {MediaRecordFilled} from './paths/mediaRecordFilled';
import {Microphone} from './paths/microphone';
import {NightShift} from './paths/nightShift';
import {ScreenSharing} from './paths/screenSharing';
import {Terminal} from './paths/terminal';
import {Xmark} from './paths/xmark';

/*
 * Types.
 */

export type IconType =
  | 'play'
  | 'pause'
  | 'prev-track'
  | 'next-track'
  | 'record'
  | 'chevron-left'
  | 'chevron-right'
  | 'bookmark'
  | 'bookmark-check'
  | 'close'
  | 'enter-fullscreen'
  | 'exit-fullscreen'
  | 'oscillator'
  | 'file-audio'
  | 'microphone'
  | 'screen-capture'
  | 'system-audio'
  | 'help'
  | 'bluesky'
  | 'command-palette'
  | 'settings'
  | 'theme-light'
  | 'theme-dark';

type IconSize = 'sm' | 'md' | 'lg';

type IconProps = {
  type: IconType;
  size: IconSize;
  class?: string;
};

/*
 * Constants.
 */

/** Nucleo Micro draws on a 20px grid, so the viewBox matches it one to one. */
const GRID_PX = 20;

const SIZE_PX_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24
};

/*
 * Component.
 */

/**
 * Renders a licensed Nucleo icon by its MilkTea role. Each path module is
 * named after its Nucleo label so a swap maps straight back to the library.
 */
export function Icon({type, size, class: className}: IconProps) {
  const sizePx = SIZE_PX_MAP[size];
  return (
    <svg
      class={className}
      width={sizePx}
      height={sizePx}
      viewBox={`0 0 ${GRID_PX} ${GRID_PX}`}
      aria-hidden="true"
    >
      {renderPaths(type)}
    </svg>
  );
}

/*
 * Helpers.
 */

function renderPaths(type: IconType) {
  switch (type) {
    case 'play':
      return <MediaPlayFilled />;
    case 'pause':
      return <MediaPauseFilled />;
    case 'prev-track':
      return <MediaPreviousFilled />;
    case 'next-track':
      return <MediaNextFilled />;
    case 'record':
      return <MediaRecordFilled />;
    case 'chevron-left':
      return <ChevronLeft />;
    case 'chevron-right':
      return <ChevronRight />;
    case 'bookmark':
      return <BookmarkPlus />;
    case 'bookmark-check':
      return <BookmarkCheck />;
    case 'close':
      return <Xmark />;
    case 'enter-fullscreen':
      return <ChevronMaximizeDiagonal />;
    case 'exit-fullscreen':
      return <ChevronMinimizeDiagonal />;
    case 'oscillator':
      return <ChartActivity2 />;
    case 'file-audio':
      return <FileMusic />;
    case 'microphone':
      return <Microphone />;
    case 'screen-capture':
      return <ScreenSharing />;
    case 'system-audio':
      return <ComputerSpeaker />;
    case 'help':
      return <CircleQuestion />;
    case 'bluesky':
      return <Bluesky />;
    case 'command-palette':
      return <Terminal />;
    case 'settings':
      return <Gear />;
    case 'theme-light':
      return <BrightnessIncrease />;
    case 'theme-dark':
      return <NightShift />;
    default:
      throw new Error(`Unknown icon type: ${String(type)}`);
  }
}
