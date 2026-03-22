/*
 * Helpers.
 */

/**
 * Returns a random number between 0 and max, inclusive.
 * The number is unbiased, meaning it is evenly distributed across the range.
 */
function unbiasedRandom(max: number): number {
  const limit = 2 ** 32 - (2 ** 32 % max);
  let r;
  do {
    r = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (r >= limit);
  return r % max;
}

/**
 * Uniform random index in `[0, length)` other than `exclude` when `length > 1`.
 */
export function randomIndexExcluding(length: number, exclude: number): number {
  if (length <= 1) {
    return 0;
  }
  const offset = unbiasedRandom(length - 1);
  return offset < exclude ? offset : offset + 1;
}
