import {useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {useSearchableList} from '../../hooks/useSearchableList';
import {supportsRequestFullscreen} from '../../lib/platform';
import {useLocaleContext} from '../../providers/locale';
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
  const {locale} = useLocaleContext();
  const hasFinePointer = useHasFinePointer();

  const [query, setQuery] = useState('');
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

  const filteredItems: readonly PaletteItem[] = useMemo(() => {
    const rawQuery = query.trim();
    if (!rawQuery) {
      return allItems;
    }

    const searchQuery = normalizeForSearch(rawQuery).toLocaleLowerCase(locale);

    return allItems.filter(item => {
      // Match against the item label.
      const normalizedLabel = normalizeForSearch(item.label).toLocaleLowerCase(locale);
      if (normalizedLabel.includes(searchQuery)) {
        return true;
      }

      // Also match against the group's localized heading (e.g., "Command", "Audio", "Settings").
      const group = parsePaletteGroup(item.type);
      const groupHeading = formatGroupHeading(t, group);
      const normalizedGroupHeading = normalizeForSearch(groupHeading).toLocaleLowerCase(locale);
      return normalizedGroupHeading.includes(searchQuery);
    });
  }, [allItems, query, locale, t]);

  const {
    itemsByGroup,
    orderedItems
  }: {
    itemsByGroup: Record<PaletteGroup, readonly PaletteItem[]>;
    orderedItems: readonly PaletteItem[];
  } = useMemo(() => {
    const grouped: Record<PaletteGroup, PaletteItem[]> = {
      command: [],
      audio: [],
      settings: []
    };

    for (const item of filteredItems) {
      const group = parsePaletteGroup(item.type);
      grouped[group].push(item);
    }

    const ordered: PaletteItem[] = [];
    for (const group of groupOrder) {
      ordered.push(...grouped[group]);
    }

    return {itemsByGroup: grouped, orderedItems: ordered};
  }, [filteredItems]);

  const {activeIndex, setActiveIndex, resetActiveIndex, moveUp, moveDown} = useSearchableList(
    orderedItems.length
  );

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
      variant={visualizerActive ? 'active' : 'splash'}
      titleId="command-palette-title"
      title={t('help.keyCommandPaletteAction')}
      onClose={onClose}
      inputRef={inputRef}
      closeBtnRef={closeBtnRef}
      searchValue={query}
      onSearchInput={value => {
        setQuery(value);
        resetActiveIndex();
      }}
      onSearchKeyDown={handleSearchKeyDown}
      searchPlaceholder={t('commandPalette.searchPlaceholder')}
    >
      {groupOrder.map(
        group =>
          itemsByGroup[group].length > 0 && (
            <div key={group} class={paletteGroup}>
              <h3 class={groupHeadingClass}>{formatGroupHeading(t, group)}</h3>
              {itemsByGroup[group].map(item => renderPaletteItem(item, item === activeItem))}
            </div>
          )
      )}
    </Picker>
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
        {
          type: PaletteItemType.SETTINGS_SKIP_SPLASH_ON_LOAD,
          label: t('settings.autoStart'),
          checked: shouldSkipSplashOnLoad,
          onChange: setShouldSkipSplashOnLoad
        },
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

/**
 * Normalize string for accent-insensitive search.
 *
 * @example
 * - 'Hello' → 'Hello'
 * - 'Héllo' → 'Hello'
 * - 'Héllo' → 'Hello'
 */
function normalizeForSearch(str: string): string {
  return str.normalize('NFD').replace(/\p{Mark}/gu, '');
}
