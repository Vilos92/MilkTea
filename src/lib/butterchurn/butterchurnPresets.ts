/*
 * Types.
 */

export type ButterchurnPresetShape = {
  baseVals: Record<string, number>;
  init_eqs_str?: string;
  frame_eqs_str?: string;
  point_eqs_str?: string;
};

export type ButterchurnPresetWave = {
  baseVals: Record<string, number>;
  init_eqs_str?: string;
  frame_eqs_str?: string;
  point_eqs_str?: string;
};

export type ButterchurnPreset = {
  baseVals: Record<string, number>;
  shapes: ButterchurnPresetShape[];
  waves: ButterchurnPresetWave[];
  init_eqs_str: string;
  frame_eqs_str: string;
  pixel_eqs_str?: string;
  pixel_eqs?: string;
  warp: string;
  comp: string;
};

/*
 * Store.
 */

let manifest: {version?: string; keys: string[]} | null = null;
const presetStore = new Map<number, ButterchurnPreset>();
const inFlight = new Map<number, Promise<ButterchurnPreset>>();

/*
 * Requests.
 */

/**
 * Fetch manifest and return the preset keys.
 */
export async function getPresetKeys(): Promise<string[]> {
  if (manifest) {
    return manifest.keys;
  }

  const res = await fetch('/butterchurn/presets/manifest.json');
  if (!res.ok) {
    throw new Error(`Failed to load preset manifest: ${res.status}`);
  }

  const data = (await res.json()) as {version?: string; keys: string[]};
  manifest = data;
  return data.keys;
}

/**
 * Fetch a single preset by index: cache hit, in-flight reuse, or fetch then store.
 * Fetches from `public/butterchurn/presets/<index>.json`.
 */
export async function fetchPresetByIndex(index: number): Promise<ButterchurnPreset> {
  const stored = presetStore.get(index);
  if (stored) {
    return Promise.resolve(stored);
  }

  const existing = inFlight.get(index);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const res = await fetch(`/butterchurn/presets/${index}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load preset ${index}: ${res.status}`);
    }
    const preset = (await res.json()) as ButterchurnPreset;
    presetStore.set(index, preset);
    return preset;
  })();

  inFlight.set(index, promise);
  promise.finally(() => inFlight.delete(index));

  return promise;
}

/**
 * Prefetch prev/current/next preset (with wrap). Dedupes via shared in-flight promises.
 */
export function prefetchNeighborPresets(index: number, count: number): void {
  if (count === 0) {
    return;
  }
  const n = count;
  const indices = [(index - 1 + n) % n, index, (index + 1) % n];
  for (const i of indices) {
    fetchPresetByIndex(i);
  }
}
