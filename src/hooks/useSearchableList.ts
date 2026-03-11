import {useCallback, useEffect, useMemo, useState} from 'preact/hooks';

import {smartSearch} from '../lib/search';

/*
 * Types.
 */

export type GetSearchTerms<TItem> = (item: TItem) => string | readonly string[];

/**
 * Manages query state, filtering, and keyboard-navigable active index for a searchable list.
 *
 * `getSearchTerms` receives a single item and returns the string(s) to match against. Any term
 * matching the query is sufficient. Uses smart search: exact match > starts-with > fuzzy (query
 * chars in order). Results are ordered by score then by match length. Wrap `getSearchTerms` in
 * `useCallback` when it has dependencies.
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
    const trimmed = query.trim();
    if (!trimmed) {
      return items;
    }
    const scoredItems = items.map(item => {
      const searchTerms = getSearchTerms(item);
      const terms = typeof searchTerms === 'string' ? [searchTerms] : [...searchTerms];
      const scored = smartSearch(query, terms);
      const score = scored.length > 0 ? scored[0].score : 0;
      const length = scored.length > 0 ? scored[0].item.length : Infinity;
      return {item, score, length};
    });
    return scoredItems
      .filter(({score}) => score > 0)
      .sort((a, b) => b.score - a.score || a.length - b.length)
      .map(({item}) => item);
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
