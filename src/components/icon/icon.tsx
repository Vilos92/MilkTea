import {Bookmark} from './paths/bookmark';
import {BookmarkCheck} from './paths/bookmarkCheck';
import {ChevronLeft} from './paths/chevronLeft';
import {ChevronRight} from './paths/chevronRight';
import {EnterFullscreen} from './paths/enterFullscreen';
import {ExitFullscreen} from './paths/exitFullscreen';
import {NextTrack} from './paths/nextTrack';
import {Pause} from './paths/pause';
import {Play} from './paths/play';
import {PrevTrack} from './paths/prevTrack';
import {Record} from './paths/record';

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
  | 'enter-fullscreen'
  | 'exit-fullscreen';

export type IconSize = 'sm' | 'md' | 'lg';

type IconProps = {
  type: IconType;
  size: IconSize;
};

/*
 * Constants.
 */

const SIZE_PX_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24
};

/*
 * Component.
 */

export function Icon({type, size}: IconProps) {
  const sizePx = SIZE_PX_MAP[size];
  return (
    <svg width={sizePx} height={sizePx} viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
      return <Play />;
    case 'pause':
      return <Pause />;
    case 'prev-track':
      return <PrevTrack />;
    case 'next-track':
      return <NextTrack />;
    case 'record':
      return <Record />;
    case 'chevron-left':
      return <ChevronLeft />;
    case 'chevron-right':
      return <ChevronRight />;
    case 'bookmark':
      return <Bookmark />;
    case 'bookmark-check':
      return <BookmarkCheck />;
    case 'enter-fullscreen':
      return <EnterFullscreen />;
    case 'exit-fullscreen':
      return <ExitFullscreen />;
    default:
      throw new Error(`Unknown icon type: ${type}`);
  }
}
