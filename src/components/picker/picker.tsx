import type {ComponentChildren, RefObject} from 'preact';

import {
  closeBtnCorner,
  closeBtnCornerSplash,
  content,
  header,
  heading,
  headingRow,
  headingSplash,
  overlayActive,
  overlaySplash,
  scrollArea,
  searchInput,
  searchInputSplash
} from './picker.css';

/*
 * Types.
 */

type PickerProps = {
  variant: 'active' | 'splash';
  titleId: string;
  title: string;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement>;
  closeBtnRef: RefObject<HTMLButtonElement>;
  searchValue: string;
  onSearchInput: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent) => void;
  searchPlaceholder: string;
  children: ComponentChildren;
};

/*
 * Component.
 */

export function Picker({
  variant,
  titleId,
  title,
  onClose,
  inputRef,
  closeBtnRef,
  searchValue,
  onSearchInput,
  onSearchKeyDown,
  searchPlaceholder,
  children
}: PickerProps) {
  const isSplash = variant === 'splash';

  return (
    <div
      class={isSplash ? overlaySplash : overlayActive}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div class={content}>
        <div class={header}>
          <div class={headingRow}>
            <h2 id={titleId} class={isSplash ? headingSplash : heading}>
              {title}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              class={isSplash ? closeBtnCornerSplash : closeBtnCorner}
              onClick={onClose}
              aria-label="Close"
              onKeyDown={event => {
                if (event.key === 'Tab' && !event.shiftKey) {
                  event.preventDefault();
                  inputRef.current?.focus();
                }
              }}
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            type="search"
            class={isSplash ? searchInputSplash : searchInput}
            value={searchValue}
            onInput={event => onSearchInput((event.target as HTMLInputElement).value)}
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        <div class={scrollArea}>{children}</div>
      </div>
    </div>
  );
}
