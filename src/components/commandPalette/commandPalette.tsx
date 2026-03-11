import {useCallback, useEffect, useMemo, useRef} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {type GetSearchTerms, useSearchableList} from '../../hooks/useSearchableList';
import {supportsRequestFullscreen} from '../../lib/platform';
import {useSettingsContext} from '../../providers/settings';
import {type Translate, useTranslate} from '../../providers/translation';
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
  switchRowActiveSplash
} from './commandPalette.css';

/*
 * Enums.
 */

const PaletteItemType = {
  COMMAND_HELP: 'command_help',
  COMMAND_PREV_PRESET: 'command_prev_preset',
  COMMAND_NEXT_PRESET: 'command_next_preset',
  COMMAND_FULL_SCREEN: 'command_full_screen',
  AUDIO_INPUT_MIC: 'audio_input_mic',
  AUDIO_INPUT_FILE: 'audio_input_file',
  AUDIO_INPUT_OSCILLATOR: 'audio_input_oscillator',
  SETTINGS_SKIP_SPLASH_ON_LOAD: 'settings_skip_splash_on_load',
  SETTINGS_SHOW_PRESET_ON_CHANGE: 'settings_show_preset_on_change',
  SETTINGS_SHOW_TRACK_ON_CHANGE: 'settings_show_track_on_change'
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
};

type SwitchPaletteItem = {
  type: PaletteItemType;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
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
  onSelectMic
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
    onOpenFilePicker
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
          <span>{item.label}</span>
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
  onOpenFilePicker: () => void
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
          onChange: setShouldSkipSplashOnLoad
        },
        {
          type: PaletteItemType.SETTINGS_SHOW_PRESET_ON_CHANGE,
          label: t('settings.showPresetNameOnChange'),
          checked: shouldShowPresetName,
          onChange: setShouldShowPresetName
        },
        {
          type: PaletteItemType.SETTINGS_SHOW_TRACK_ON_CHANGE,
          label: t('settings.showTrackNameOnChange'),
          checked: shouldShowTrackName,
          onChange: setShouldShowTrackName
        },
        // Commands
        {
          type: PaletteItemType.COMMAND_HELP,
          label: t('help.openLabel'),
          onSelect: onOpenHelp
        },
        {
          type: PaletteItemType.COMMAND_PREV_PRESET,
          label: t('controls.prevPreset'),
          onSelect: onPrevPreset
        },
        {
          type: PaletteItemType.COMMAND_NEXT_PRESET,
          label: t('controls.nextPreset'),
          onSelect: onNextPreset
        },
        supportsRequestFullscreen
          ? {
              type: PaletteItemType.COMMAND_FULL_SCREEN,
              label: isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen'),
              onSelect: onFullScreen
            }
          : undefined,
        // Audio
        {
          type: PaletteItemType.AUDIO_INPUT_OSCILLATOR,
          label: t('source.oscillator'),
          onSelect: onSelectOscillator
        },
        {
          type: PaletteItemType.AUDIO_INPUT_FILE,
          label: t('source.file'),
          onSelect: onOpenFilePicker
        },
        {
          type: PaletteItemType.AUDIO_INPUT_MIC,
          label: t('source.microphone'),
          onSelect: onSelectMic
        }
      ].filter(item => item !== undefined),
    [
      isFullscreen,
      onFullScreen,
      onNextPreset,
      onOpenFilePicker,
      onOpenHelp,
      onPrevPreset,
      onSelectMic,
      onSelectOscillator,
      setShouldSkipSplashOnLoad,
      setShouldShowPresetName,
      setShouldShowTrackName,
      shouldSkipSplashOnLoad,
      shouldShowPresetName,
      shouldShowTrackName,
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
 * - SETTINGS_SHOW_PRESET_ON_CHANGE → 'settings'
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
