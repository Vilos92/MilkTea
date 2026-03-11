import type {ComponentChildren, RefObject} from 'preact';

import {
  closeBtnAdaptive,
  closeBtnDark,
  content,
  header,
  headingAdaptive,
  headingDark,
  headingRow,
  overlayAdaptive,
  overlayDark,
  scrollArea,
  searchInputAdaptive,
  searchInputDark
} from './picker.css';

/*
 * Types.
 */

type PickerProps = {
  children: ComponentChildren;
  variant: 'dark' | 'adaptive';
  id: string;
  title: string;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement>;
  closeBtnRef: RefObject<HTMLButtonElement>;
  searchValue: string;
  onSearchInput: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent) => void;
  searchPlaceholder: string;
};

/*
 * Component.
 */

export function Picker({
  children,
  variant,
  id,
  title,
  onClose,
  inputRef,
  closeBtnRef,
  searchValue,
  onSearchInput,
  onSearchKeyDown,
  searchPlaceholder
}: PickerProps) {
  const isAdaptive = variant === 'adaptive';

  return (
    <div
      class={isAdaptive ? overlayAdaptive : overlayDark}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
    >
      <div class={content}>
        <div class={header}>
          <div class={headingRow}>
            <h2 id={id} class={isAdaptive ? headingAdaptive : headingDark}>
              {title}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              class={isAdaptive ? closeBtnAdaptive : closeBtnDark}
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
            class={isAdaptive ? searchInputAdaptive : searchInputDark}
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
