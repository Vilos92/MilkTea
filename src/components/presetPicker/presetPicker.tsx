import {createPortal} from 'preact/compat';
import {useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {useHasFinePointer} from '../../hooks/useHasFinePointer';
import {useSearchableList} from '../../hooks/useSearchableList';
import {commandButton, commandButtonActive} from '../commandPalette/commandPalette.css';
import {Picker} from '../picker/picker';
import {selectedItem as selectedItemClass} from './presetPicker.css';

/*
 * Types.
 */

type PresetPickerProps = {
  items: string[];
  selectedItem?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
  title: string;
  placeholder: string;
};

/*
 * Component.
 */

export function PresetPicker({
  items,
  selectedItem,
  onSelect,
  onClose,
  title,
  placeholder
}: PresetPickerProps) {
  const hasFinePointer = useHasFinePointer();
  const inputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(item => item.toLowerCase().includes(q));
  }, [items, query]);

  const {activeIndex, setActiveIndex, resetActiveIndex, moveUp, moveDown} = useSearchableList(
    filteredItems.length
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

  const portalTarget = document.getElementById('app') ?? document.body;

  return createPortal(
    <Picker
      variant="active"
      titleId="preset-picker-title"
      title={title}
      onClose={onClose}
      inputRef={inputRef}
      closeBtnRef={closeBtnRef}
      searchValue={query}
      onSearchInput={value => {
        setQuery(value);
        resetActiveIndex();
      }}
      onSearchKeyDown={handleSearchKeyDown}
      searchPlaceholder={placeholder}
    >
      <div role="listbox" aria-label={title}>
        {filteredItems.map((item, i) => {
          const isActive = i === activeIndex;
          const isSelected = item === selectedItem;
          return (
            <button
              ref={isActive ? activeItemRef : undefined}
              key={item}
              type="button"
              class={[commandButton, isActive && commandButtonActive, isSelected && selectedItemClass]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </Picker>,
    portalTarget
  );
}
