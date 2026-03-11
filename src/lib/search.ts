/*
 * Constants.
 */

const SCORE_EXACT = 100;
const SCORE_STARTS_WITH = 50;
const SCORE_FUZZY = 10;

/** Escapes regex meta characters in a string for safe use in a pattern. */
const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** Unicode combining marks (NFD), for accent-insensitive normalisation. */
const REGEX_MARK = /\p{Mark}/gu;

/*
 * Search helpers.
 */

/**
 * Filters and sorts terms by relevance to the query; returns scored pairs (best first).
 * Empty query returns each term with score 0 (caller can treat as no filter).
 */
export function smartSearch(query: string, list: readonly string[]): Array<{item: string; score: number}> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return list.map(item => ({item, score: 0}));
  }
  return list
    .map(item => ({item, score: scoreMatch(trimmedQuery, item)}))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.length - b.item.length);
}

/**
 * Scores how well a term matches the query (0 = no match).
 * Normalizes query and term for accent-insensitive matching.
 */
function scoreMatch(query: string, term: string): number {
  const normalizedQuery = normalizeForSearch(query).toLowerCase();
  const normalizedTerm = normalizeForSearch(term);
  const termLower = normalizedTerm.toLowerCase();
  if (termLower === normalizedQuery) {
    return SCORE_EXACT;
  }
  if (termLower.startsWith(normalizedQuery)) {
    return SCORE_STARTS_WITH;
  }
  const pattern = normalizedQuery
    .split('')
    .map(c => c.replace(REGEX_ESCAPE, '\\$&'))
    .join('.*');
  return new RegExp(pattern, 'i').test(normalizedTerm) ? SCORE_FUZZY : 0;
}

/** Accent-insensitive normalisation for search matching. */
function normalizeForSearch(str: string): string {
  return str.normalize('NFD').replace(REGEX_MARK, '');
}
