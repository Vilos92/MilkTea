import type {ComponentChildren, RefObject} from 'preact';

import {useTranslate} from '../../providers/translation';
import type {IconType} from '../icon/icon';
import {Icon} from '../icon/icon';

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

type PickerVariant = 'dark' | 'adaptive';

type PickerProps = {
  children: ComponentChildren;
  variant: PickerVariant;
  id: string;
  title: string;
  titleIcon?: IconType;
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
  titleIcon,
  onClose,
  inputRef,
  closeBtnRef,
  searchValue,
  onSearchInput,
  onSearchKeyDown,
  searchPlaceholder
}: PickerProps) {
  const t = useTranslate();
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
              {titleIcon != null ? <Icon type={titleIcon} size="sm" /> : null}
              {title}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              class={isAdaptive ? closeBtnAdaptive : closeBtnDark}
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
              onKeyDown={event => {
                if (event.key === 'Tab' && !event.shiftKey) {
                  event.preventDefault();
                  inputRef.current?.focus();
                }
              }}
            >
              <Icon type="close" size="sm" />
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
