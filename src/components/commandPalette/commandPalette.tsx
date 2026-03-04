import {useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {useLocaleContext} from '../../provider/locale';
import {useTranslate} from '../../provider/translation';
import {Switch} from '../switch/switch';
import {
  closeBtn,
  closeBtnSplash,
  closeRow,
  commandButton,
  commandButtonActive,
  content,
  group,
  groupHeading,
  header,
  heading,
  headingSplash,
  overlayActive,
  overlaySplash,
  scrollArea,
  searchInput,
  switchRow,
  switchRowActive
} from './commandPalette.css.ts';

/*
 * Palette item types and group derivation.
 */

export const PaletteItemType = {
  COMMAND_HELP: 'command_help',
  COMMAND_PREV_PRESET: 'command_prev_preset',
  COMMAND_NEXT_PRESET: 'command_next_preset',
  COMMAND_FULL_SCREEN: 'command_full_screen',
  AUDIO_INPUT_MIC: 'audio_input_mic',
  AUDIO_INPUT_FILE: 'audio_input_file',
  AUDIO_INPUT_OSCILLATOR: 'audio_input_oscillator',
  SETTINGS_SHOW_PRESET_ON_CHANGE: 'settings_show_preset_on_change',
  SETTINGS_SHOW_TRACK_ON_CHANGE: 'settings_show_track_on_change'
} as const;

export type PaletteItemType = (typeof PaletteItemType)[keyof typeof PaletteItemType];

/** Derive group from type key prefix: SETTINGS_ → 'settings', COMMAND_ → 'command', AUDIO_ → 'audio'. */
export function getGroup(type: PaletteItemType): 'settings' | 'command' | 'audio' {
  if (type.startsWith('settings_')) return 'settings';
  if (type.startsWith('command_')) return 'command';
  if (type.startsWith('audio_')) return 'audio';
  return 'settings';
}

export type SwitchPaletteItem = {
  type: PaletteItemType;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export type CommandPaletteItem = {
  type: PaletteItemType;
  label: string;
  onSelect: () => void;
};

export type PaletteItem = SwitchPaletteItem | CommandPaletteItem;

function isSwitchItem(item: PaletteItem): item is SwitchPaletteItem {
  return 'onChange' in item;
}

/** Normalize string for accent-insensitive search (NFD + strip combining marks). */
function normalizeForSearch(str: string): string {
  return str.normalize('NFD').replace(/\p{Mark}/gu, '');
}

/*
 * Component props.
 */

type CommandPaletteProps = {
  visualizerActive: boolean;
  showPresetNameOnChange: boolean;
  showTrackNameOnChange: boolean;
  onShowPresetNameOnChange: (value: boolean) => void;
  onShowTrackNameOnChange: (value: boolean) => void;
  onClose: () => void;
  onOpenHelp?: () => void;
  onPrevPreset?: () => void;
  onNextPreset?: () => void;
  isFullscreen?: boolean;
  onFullScreen?: () => void;
  onOpenFilePicker?: () => void;
  onSelectOscillator?: () => void;
  onSelectMic?: () => void;
};

/*
 * Component.
 */

export function CommandPalette({
  visualizerActive,
  showPresetNameOnChange,
  showTrackNameOnChange,
  onShowPresetNameOnChange,
  onShowTrackNameOnChange,
  onClose,
  onOpenHelp,
  onPrevPreset,
  onNextPreset,
  isFullscreen = false,
  onFullScreen,
  onOpenFilePicker,
  onSelectOscillator,
  onSelectMic
}: CommandPaletteProps) {
  const t = useTranslate();
  const {locale} = useLocaleContext();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const overlayClass = visualizerActive ? overlayActive : overlaySplash;
  const headingClass = visualizerActive ? heading : headingSplash;
  const closeBtnClass = visualizerActive ? closeBtn : closeBtnSplash;

  const allItems: PaletteItem[] = useMemo(
    () => [
      {
        type: PaletteItemType.COMMAND_HELP,
        label: t('help.openLabel'),
        onSelect: onOpenHelp ?? (() => {})
      },
      {
        type: PaletteItemType.COMMAND_PREV_PRESET,
        label: t('controls.prevPreset'),
        onSelect: onPrevPreset ?? (() => {})
      },
      {
        type: PaletteItemType.COMMAND_NEXT_PRESET,
        label: t('controls.nextPreset'),
        onSelect: onNextPreset ?? (() => {})
      },
      {
        type: PaletteItemType.COMMAND_FULL_SCREEN,
        label: isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen'),
        onSelect: onFullScreen ?? (() => {})
      },
      {
        type: PaletteItemType.AUDIO_INPUT_OSCILLATOR,
        label: t('source.oscillator'),
        onSelect: onSelectOscillator ?? (() => {})
      },
      {
        type: PaletteItemType.AUDIO_INPUT_MIC,
        label: t('source.microphone'),
        onSelect: onSelectMic ?? (() => {})
      },
      {
        type: PaletteItemType.AUDIO_INPUT_FILE,
        label: t('source.file'),
        onSelect: onOpenFilePicker ?? (() => {})
      },
      {
        type: PaletteItemType.SETTINGS_SHOW_PRESET_ON_CHANGE,
        label: t('settings.showPresetNameOnChange'),
        checked: showPresetNameOnChange,
        onChange: onShowPresetNameOnChange
      },
      {
        type: PaletteItemType.SETTINGS_SHOW_TRACK_ON_CHANGE,
        label: t('settings.showTrackNameOnChange'),
        checked: showTrackNameOnChange,
        onChange: onShowTrackNameOnChange
      }
    ],
    [
      t,
      showPresetNameOnChange,
      showTrackNameOnChange,
      onShowPresetNameOnChange,
      onShowTrackNameOnChange,
      onOpenHelp,
      onPrevPreset,
      onNextPreset,
      isFullscreen,
      onFullScreen,
      onOpenFilePicker,
      onSelectOscillator,
      onSelectMic
    ]
  );

  const filteredItems = useMemo(() => {
    const raw = query.trim();
    if (!raw) return allItems;
    const q = normalizeForSearch(raw).toLocaleLowerCase(locale);
    return allItems.filter(item => normalizeForSearch(item.label).toLocaleLowerCase(locale).includes(q));
  }, [allItems, query, locale]);

  const byGroup = useMemo(() => {
    const map = new Map<'settings' | 'command' | 'audio', PaletteItem[]>();
    for (const item of filteredItems) {
      const g = getGroup(item.type);
      const list = map.get(g) ?? [];
      list.push(item);
      map.set(g, list);
    }
    return map;
  }, [filteredItems]);

  const groupOrder: ('command' | 'audio' | 'settings')[] = ['command', 'audio', 'settings'];
  const activeItem = filteredItems[activeIndex];

  // Clamp activeIndex when filtered list shrinks
  useEffect(() => {
    setActiveIndex(i => Math.min(i, Math.max(0, filteredItems.length - 1)));
  }, [filteredItems.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filteredItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      if (!activeItem) return;
      e.preventDefault();
      if (isSwitchItem(activeItem)) {
        activeItem.onChange(!activeItem.checked);
      } else {
        activeItem.onSelect();
        onClose();
      }
    }
  }

  return (
    <div class={overlayClass} role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
      <div class={content}>
        <div class={header}>
          <h2 id="command-palette-title" class={headingClass}>
            {t('help.keySettingsAction')}
          </h2>
          <input
            ref={inputRef}
            type="search"
            class={searchInput}
            value={query}
            onInput={e => {
              setQuery((e.target as HTMLInputElement).value);
              setActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('commandPalette.searchPlaceholder')}
            aria-label={t('commandPalette.searchPlaceholder')}
          />
        </div>
        <div class={scrollArea}>
          {groupOrder.map(
            g =>
              byGroup.get(g)?.length && (
                <div key={g} class={group}>
                  <h3 class={groupHeading}>
                    {t(
                      g === 'command'
                        ? 'commandPalette.group.command'
                        : g === 'audio'
                          ? 'commandPalette.group.audio'
                          : 'commandPalette.group.settings'
                    )}
                  </h3>
                  {byGroup.get(g)!.map(item => {
                    const isActive = item === activeItem;
                    return isSwitchItem(item) ? (
                      <div
                        key={item.type}
                        class={[switchRow, isActive && switchRowActive].filter(Boolean).join(' ')}
                        onClick={() => {
                          setActiveIndex(filteredItems.indexOf(item));
                          inputRef.current?.focus();
                        }}
                      >
                        <span>{item.label}</span>
                        <Switch checked={item.checked} onChange={item.onChange} />
                      </div>
                    ) : (
                      <button
                        key={item.type}
                        type="button"
                        class={[commandButton, isActive && commandButtonActive].filter(Boolean).join(' ')}
                        onClick={() => {
                          item.onSelect();
                          onClose();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )
          )}
        </div>
        <div class={closeRow}>
          <button type="button" class={closeBtnClass} onClick={onClose} aria-label={t('settings.close')}>
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
