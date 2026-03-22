import {useCallback, useEffect, useRef} from 'preact/hooks';

import {randomIndexExcluding} from '../lib/random';
import {useSettingsContext} from '../providers/settings';

/*
 * Constants.
 */

const PRESET_CYCLE_INTERVAL_MS = 30_000;

/*
 * Types.
 */

export type UseCyclePresetsParams = {
  started: boolean;
  presetKeysLength: number;
  presetIndex: number | undefined;
  changePreset: (delta: number) => void;
  loadPresetByIndex: (index: number) => void;
};

/*
 * Hook.
 */

/**
 * Interval-driven preset cycling to change visualizers based on settings.
 */
export function useCyclePresets({
  started,
  presetKeysLength,
  presetIndex,
  changePreset,
  loadPresetByIndex
}: UseCyclePresetsParams): {restartPresetCycle: () => void} {
  const {shouldCyclePresets, shouldRandomizePresets} = useSettingsContext();

  const restartPresetCycleRef = useRef<(() => void) | null>(null);
  const tickConfigRef = useRef<{
    shouldRandomizePresets: boolean;
    presetKeysLength: number;
    presetIndex: number | undefined;
    changePreset: (delta: number) => void;
    loadPresetByIndex: (index: number) => void;
  }>({
    shouldRandomizePresets: false,
    presetKeysLength: 0,
    presetIndex: undefined,
    changePreset: () => {},
    loadPresetByIndex: () => {}
  });

  tickConfigRef.current = {
    shouldRandomizePresets,
    presetKeysLength,
    presetIndex,
    changePreset,
    loadPresetByIndex
  };

  useEffect(() => {
    if (!shouldCyclePresets || !started || presetKeysLength === 0) {
      restartPresetCycleRef.current = null;
      return;
    }

    const runTick = () => {
      const cfg = tickConfigRef.current;
      if (cfg.shouldRandomizePresets) {
        cfg.loadPresetByIndex(randomIndexExcluding(cfg.presetKeysLength, cfg.presetIndex ?? 0));
        return;
      }
      cfg.changePreset(1);
    };

    let intervalId = window.setInterval(runTick, PRESET_CYCLE_INTERVAL_MS);

    restartPresetCycleRef.current = () => {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(runTick, PRESET_CYCLE_INTERVAL_MS);
    };

    return () => {
      window.clearInterval(intervalId);
      restartPresetCycleRef.current = null;
    };
  }, [shouldCyclePresets, started, presetKeysLength]);

  const restartPresetCycle = useCallback(() => {
    restartPresetCycleRef.current?.();
  }, []);

  return {restartPresetCycle};
}
