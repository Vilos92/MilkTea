import {useCallback, useEffect, useMemo, useState} from 'preact/hooks';

/*
 * Types.
 */

export type GetSearchTerms<TItem> = (item: TItem) => string | readonly string[];

/**
 * Manages query state, filtering, and keyboard-navigable active index for a searchable list.
 *
 * `getSearchTerms` receives a single item and returns the string(s) to match against. Any term
 * matching the query is sufficient. Wrap in `useCallback` when it has dependencies.
 *
 * Items should arrive pre-sorted in the desired navigation order — the hook preserves that order
 * while filtering and does not reorder results.
 *
 * The active index resets to 0 when the query changes, and clamps when the filtered list shrinks.
 */
export function useSearchableList<TItem>(
  items: readonly TItem[],
  getSearchTerms: (item: TItem) => string | readonly string[]
) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query.trim()).toLocaleLowerCase();
    if (!normalizedQuery) {
      return items;
    }
    return items.filter(item => {
      const searchTerms = getSearchTerms(item);
      const terms = typeof searchTerms === 'string' ? [searchTerms] : searchTerms;
      return terms.some(term => normalizeForSearch(term).toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [items, query, getSearchTerms]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    setActiveIndex(index => Math.min(index, Math.max(0, filteredItems.length - 1)));
  }, [filteredItems.length]);

  const moveUp = useCallback(() => {
    setActiveIndex(index => Math.max(0, index - 1));
  }, []);

  const moveDown = useCallback(() => {
    setActiveIndex(index => Math.min(index + 1, filteredItems.length - 1));
  }, [filteredItems.length]);

  return {
    query,
    setQuery,
    filteredItems,
    activeIndex,
    setActiveIndex,
    moveUp,
    moveDown
  };
}

/*
 * Helpers.
 */

export function makeGetSearchTerms<TItem>(getSearchTerms: (item: TItem) => string | readonly string[]) {
  return (item: TItem) => {
    const searchTerms = getSearchTerms(item);
    const terms = typeof searchTerms === 'string' ? [searchTerms] : searchTerms;
    return terms.map(term => normalizeForSearch(term).toLocaleLowerCase());
  };
}

/**
 * Accent-insensitive normalisation for search matching.
 * @example 'Héllo' → 'Hello'
 */
function normalizeForSearch(str: string): string {
  return str.normalize('NFD').replace(/\p{Mark}/gu, '');
}
