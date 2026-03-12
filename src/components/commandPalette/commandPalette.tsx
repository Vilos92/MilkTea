import {useCallback, useEffect, useMemo, useRef} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {type GetSearchTerms, useSearchableList} from '../../hooks/useSearchableList';
import {supportsRequestFullscreen} from '../../lib/platform';
import {useSettingsContext} from '../../providers/settings';
import {type Translate, useTranslate} from '../../providers/translation';
import type {AudioFilePlayback} from '../../types/audio';
import {Icon, type IconType} from '../icon/icon';
import {Picker} from '../picker/picker';
import {Switch} from '../switch/switch';
import {
  commandButton,
  commandButtonActive,
  commandButtonActiveSplash,
  commandButtonSplash,
  groupHeading,
  groupHeadingSplash,
  paletteGroup,
  switchRow,
  switchRowActive,
  switchRowActiveSplash,
  switchRowLabel
} from './commandPalette.css';

/*
 * Enums.
 */

const PaletteItemType = {
  COMMAND_HELP: 'command_help',
  COMMAND_PREV_PRESET: 'command_prev_preset',
  COMMAND_NEXT_PRESET: 'command_next_preset',
  COMMAND_FULL_SCREEN: 'command_full_screen',
  COMMAND_PLAY_PAUSE: 'command_play_pause',
  COMMAND_STAGE_OR_LAUNCH_PRESET: 'command_stage_or_launch_preset',
  AUDIO_INPUT_MIC: 'audio_input_mic',
  AUDIO_INPUT_FILE: 'audio_input_file',
  AUDIO_INPUT_OSCILLATOR: 'audio_input_oscillator',
  SETTINGS_SKIP_SPLASH_ON_LOAD: 'settings_skip_splash_on_load',
  SETTINGS_SHOW_PRESET_IN_CONTROLS: 'settings_show_preset_in_controls',
  SETTINGS_SHOW_TRACK_IN_CONTROLS: 'settings_show_track_in_controls'
} as const;
type PaletteItemType = (typeof PaletteItemType)[keyof typeof PaletteItemType];

type PaletteGroup = 'command' | 'audio' | 'settings';

/*
 * Constants.
 */

const groupOrder: readonly PaletteGroup[] = ['settings', 'command', 'audio'];

/*
 * Types.
 */

type CommandPaletteItem = {
  type: PaletteItemType;
  label: string;
  onSelect: () => void;
  iconType: IconType;
};

type SwitchPaletteItem = {
  type: PaletteItemType;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  iconType: IconType;
};

type PaletteItem = CommandPaletteItem | SwitchPaletteItem;

function isSwitchPaletteItem(item: PaletteItem): item is SwitchPaletteItem {
  return 'onChange' in item;
}

type CommandPaletteProps = {
  visualizerActive: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
  onPrevPreset: () => void;
  onNextPreset: () => void;
  isFullscreen: boolean;
  onFullScreen: () => void;
  onOpenFilePicker: () => void;
  onSelectOscillator: () => void;
  onSelectMic: () => void;
  filePlayback: AudioFilePlayback | undefined;
  hasPresets: boolean;
  stagedPresetName: string | undefined;
  onOpenPresetPicker: () => void;
  onFireStagedPreset: () => void;
};

/*
 * Component.
 */

export function CommandPalette({
  visualizerActive,
  onClose,
  onOpenHelp,
  onPrevPreset,
  onNextPreset,
  isFullscreen,
  onFullScreen,
  onOpenFilePicker,
  onSelectOscillator,
  onSelectMic,
  filePlayback,
  hasPresets,
  stagedPresetName,
  onOpenPresetPicker,
  onFireStagedPreset
}: CommandPaletteProps) {
  const t = useTranslate();
  const hasFinePointer = useHasFinePointer();

  const inputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const groupHeadingClass = visualizerActive ? groupHeading : groupHeadingSplash;
  const commandButtonClass = visualizerActive ? commandButton : commandButtonSplash;
  const commandButtonActiveClass = visualizerActive ? commandButtonActive : commandButtonActiveSplash;
  const switchRowActiveClass = visualizerActive ? switchRowActive : switchRowActiveSplash;

  const allItems: readonly PaletteItem[] = usePaletteItems(
    onOpenHelp,
    onPrevPreset,
    onNextPreset,
    isFullscreen,
    onFullScreen,
    onSelectOscillator,
    onSelectMic,
    onOpenFilePicker,
    filePlayback,
    hasPresets,
    stagedPresetName,
    onOpenPresetPicker,
    onFireStagedPreset
  );

  const getSearchTerms = useCallback<GetSearchTerms<PaletteItem>>(
    (item: PaletteItem) => [item.label, formatGroupHeading(t, parsePaletteGroup(item.type))],
    [t]
  );

  const {
    query,
    setQuery,
    filteredItems: orderedItems,
    activeIndex,
    setActiveIndex,
    moveUp,
    moveDown
  } = useSearchableList(allItems, getSearchTerms);

  const itemsByGroup = useMemo(() => {
    const grouped: Record<PaletteGroup, PaletteItem[]> = {command: [], audio: [], settings: []};
    for (const item of orderedItems) {
      grouped[parsePaletteGroup(item.type)].push(item);
    }
    return grouped as Record<PaletteGroup, readonly PaletteItem[]>;
  }, [orderedItems]);

  const activeItem = orderedItems[activeIndex];

  useEffect(() => {
    if (!hasFinePointer) {
      return;
    }
    inputRef.current?.focus();
  }, [hasFinePointer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSearchKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
      event.preventDefault();
      moveDown();
      return;
    }
    if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
      event.preventDefault();
      if (event.key === 'Tab' && activeIndex === 0) {
        closeBtnRef.current?.focus();
      } else {
        moveUp();
      }
      return;
    }
    if (event.key === 'Enter') {
      if (!activeItem) {
        return;
      }
      event.preventDefault();
      if (isSwitchPaletteItem(activeItem)) {
        activeItem.onChange(!activeItem.checked);
        return;
      }

      activeItem.onSelect();
      onClose();
    }
  };

  const renderPaletteItem = (item: PaletteItem, isActive: boolean) => {
    if (isSwitchPaletteItem(item)) {
      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          key={item.type}
          class={[switchRow, isActive && switchRowActiveClass].filter(Boolean).join(' ')}
          onClick={() => {
            setActiveIndex(orderedItems.indexOf(item));
            inputRef.current?.focus();
          }}
        >
          <span class={switchRowLabel}>
            <Icon type={item.iconType} size="sm" />
            <span>{item.label}</span>
          </span>
          <Switch checked={item.checked} onChange={item.onChange} label={item.label} />
        </div>
      );
    }

    return (
      <button
        key={item.type}
        type="button"
        class={[commandButtonClass, isActive && commandButtonActiveClass].filter(Boolean).join(' ')}
        onClick={() => {
          item.onSelect();
          onClose();
        }}
      >
        <Icon type={item.iconType} size="sm" />
        {item.label}
      </button>
    );
  };

  return (
    <Picker
      children={groupOrder.map(
        group =>
          itemsByGroup[group].length > 0 && (
            <div key={group} class={paletteGroup}>
              <h3 class={groupHeadingClass}>{formatGroupHeading(t, group)}</h3>
              {itemsByGroup[group].map(item => renderPaletteItem(item, item === activeItem))}
            </div>
          )
      )}
      variant={visualizerActive ? 'dark' : 'adaptive'}
      id="command-palette-title"
      title={t('help.keyCommandPaletteAction')}
      titleIcon="command-palette"
      onClose={onClose}
      inputRef={inputRef}
      closeBtnRef={closeBtnRef}
      searchValue={query}
      onSearchInput={setQuery}
      onSearchKeyDown={handleSearchKeyDown}
      searchPlaceholder={t('commandPalette.searchPlaceholder')}
    />
  );
}

/*
 * Hooks.
 */

function usePaletteItems(
  onOpenHelp: () => void,
  onPrevPreset: () => void,
  onNextPreset: () => void,
  isFullscreen: boolean,
  onFullScreen: () => void,
  onSelectOscillator: () => void,
  onSelectMic: () => void,
  onOpenFilePicker: () => void,
  filePlayback: AudioFilePlayback | undefined,
  hasPresets: boolean,
  stagedPresetName: string | undefined,
  onOpenPresetPicker: () => void,
  onFireStagedPreset: () => void
): readonly PaletteItem[] {
  const t = useTranslate();
  const {
    shouldSkipSplashOnLoad,
    setShouldSkipSplashOnLoad,
    shouldShowPresetName,
    setShouldShowPresetName,
    shouldShowTrackName,
    setShouldShowTrackName
  } = useSettingsContext();

  return useMemo(
    () =>
      [
        // Settings
        {
          type: PaletteItemType.SETTINGS_SKIP_SPLASH_ON_LOAD,
          label: t('settings.autoStart'),
          checked: shouldSkipSplashOnLoad,
          onChange: setShouldSkipSplashOnLoad,
          iconType: 'settings' as IconType
        },
        {
          type: PaletteItemType.SETTINGS_SHOW_PRESET_IN_CONTROLS,
          label: t('settings.showPresetNameInControls'),
          checked: shouldShowPresetName,
          onChange: setShouldShowPresetName,
          iconType: 'settings' as IconType
        },
        {
          type: PaletteItemType.SETTINGS_SHOW_TRACK_IN_CONTROLS,
          label: t('settings.showTrackNameInControls'),
          checked: shouldShowTrackName,
          onChange: setShouldShowTrackName,
          iconType: 'settings' as IconType
        },
        // Commands
        {
          type: PaletteItemType.COMMAND_HELP,
          label: t('common.help'),
          onSelect: onOpenHelp,
          iconType: 'help' as IconType
        },
        supportsRequestFullscreen
          ? {
              type: PaletteItemType.COMMAND_FULL_SCREEN,
              label: isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen'),
              onSelect: onFullScreen,
              iconType: (isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen') as IconType
            }
          : undefined,
        {
          type: PaletteItemType.COMMAND_PREV_PRESET,
          label: t('controls.prevPreset'),
          onSelect: onPrevPreset,
          iconType: 'chevron-left' as IconType
        },
        {
          type: PaletteItemType.COMMAND_NEXT_PRESET,
          label: t('controls.nextPreset'),
          onSelect: onNextPreset,
          iconType: 'chevron-right' as IconType
        },
        hasPresets
          ? {
              type: PaletteItemType.COMMAND_STAGE_OR_LAUNCH_PRESET,
              label: stagedPresetName ? t('controls.firePreset') : t('controls.stagePreset'),
              onSelect: stagedPresetName ? onFireStagedPreset : onOpenPresetPicker,
              iconType: (stagedPresetName ? 'bookmark-check' : 'bookmark') as IconType
            }
          : undefined,
        filePlayback != null
          ? {
              type: PaletteItemType.COMMAND_PLAY_PAUSE,
              label: filePlayback.isPlaying ? t('controls.pause') : t('controls.play'),
              onSelect: filePlayback.onPlayPause,
              iconType: (filePlayback.isPlaying ? 'pause' : 'play') as IconType
            }
          : undefined,
        // Audio
        {
          type: PaletteItemType.AUDIO_INPUT_OSCILLATOR,
          label: t('source.oscillator'),
          onSelect: onSelectOscillator,
          iconType: 'oscillator' as IconType
        },
        {
          type: PaletteItemType.AUDIO_INPUT_FILE,
          label: t('source.file'),
          onSelect: onOpenFilePicker,
          iconType: 'file-audio' as IconType
        },
        {
          type: PaletteItemType.AUDIO_INPUT_MIC,
          label: t('source.microphone'),
          onSelect: onSelectMic,
          iconType: 'microphone' as IconType
        }
      ].filter(item => item !== undefined),
    [
      filePlayback,
      hasPresets,
      isFullscreen,
      onFullScreen,
      onNextPreset,
      onFireStagedPreset,
      onOpenFilePicker,
      onOpenHelp,
      onOpenPresetPicker,
      onPrevPreset,
      onSelectMic,
      onSelectOscillator,
      setShouldSkipSplashOnLoad,
      setShouldShowPresetName,
      setShouldShowTrackName,
      shouldSkipSplashOnLoad,
      shouldShowPresetName,
      shouldShowTrackName,
      stagedPresetName,
      t
    ]
  );
}

/*
 * Helpers.
 */

function formatGroupHeading(t: Translate, group: PaletteGroup): string {
  switch (group) {
    case 'command':
      return t('commandPalette.group.command');
    case 'audio':
      return t('commandPalette.group.audio');
    case 'settings':
      return t('commandPalette.group.settings');
    default:
      throw new Error(`Unknown palette group: ${group}`);
  }
}

/**
 * Derive group from type key prefix.
 *
 * @example
 * - SETTINGS_SHOW_PRESET_IN_CONTROLS → 'settings'
 * - COMMAND_HELP → 'command'
 * - AUDIO_INPUT_MIC → 'audio'
 */
function parsePaletteGroup(type: PaletteItemType): PaletteGroup {
  if (type.startsWith('settings_')) {
    return 'settings';
  }
  if (type.startsWith('command_')) {
    return 'command';
  }
  if (type.startsWith('audio_')) {
    return 'audio';
  }
  return 'settings';
}
