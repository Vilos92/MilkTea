import {useEffect, useRef} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {type GetSearchTerms, useSearchableList} from '../../hooks/useSearchableList';
import {VibrationPattern} from '../../lib/vibrate';
import {useTranslate} from '../../providers/translation';
import {ChromelessButton} from '../chromelessButton/chromelessButton';
import {Picker} from '../picker/picker';

import {
  commandButton,
  commandButtonActive,
  commandButtonTouchCoarse
} from '../commandPalette/commandPalette.css';
import {selectedItem as selectedItemClass} from './presetPicker.css';

/*
 * Types.
 */

type PresetPickerProps = {
  items: string[];
  selectedItem?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
};

/*
 * Component.
 */

export function PresetPicker({items, selectedItem, onSelect, onClose}: PresetPickerProps) {
  const t = useTranslate();
  const hasFinePointer = useHasFinePointer();
  const inputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const {query, setQuery, filteredItems, activeIndex, setActiveIndex, moveUp, moveDown} = useSearchableList(
    items,
    getSearchTerm
  );

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

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({block: 'nearest'});
  }, [activeIndex]);

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
      event.preventDefault();
      const item = filteredItems[activeIndex];
      if (item) {
        onSelect(item);
        onClose();
      }
    }
  };

  return (
    <Picker
      children={
        <div role="listbox" aria-label={t('controls.presets')}>
          {filteredItems.map((item, index) => {
            const isActive = index === activeIndex;
            const isSelected = item === selectedItem;
            return (
              <ChromelessButton
                buttonRef={isActive ? activeItemRef : undefined}
                key={item}
                class={[commandButton, isActive && commandButtonActive, isSelected && selectedItemClass]
                  .filter(Boolean)
                  .join(' ')}
                pressActiveClass={commandButtonTouchCoarse}
                vibration={VibrationPattern.MEDIUM}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                {item}
              </ChromelessButton>
            );
          })}
        </div>
      }
      variant="dark"
      id="preset-picker-title"
      title={t('controls.presets')}
      titleIcon="bookmark"
      onClose={onClose}
      inputRef={inputRef}
      closeBtnRef={closeBtnRef}
      searchValue={query}
      onSearchInput={setQuery}
      onSearchKeyDown={handleSearchKeyDown}
      searchPlaceholder={t('controls.searchPresets')}
    />
  );
}

/*
 * Helpers.
 */

const getSearchTerm: GetSearchTerms<string> = (item: string) => item;
