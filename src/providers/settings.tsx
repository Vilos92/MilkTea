import {createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useCallback, useContext, useState} from 'preact/hooks';

import {
  DEFAULT_CYCLE_PRESETS,
  DEFAULT_RANDOMIZE_PRESETS,
  DEFAULT_SHOW_PRESET_IN_CONTROLS,
  DEFAULT_SHOW_TRACK_IN_CONTROLS,
  DEFAULT_SKIP_SPLASH_ON_LOAD
} from '../lib/settings';
import {
  getStorageCyclePresets,
  getStorageRandomizePresets,
  getStorageShowPresetNameInControls,
  getStorageShowTrackNameInControls,
  getStorageSkipSplashOnLoad,
  setStorageCyclePresets,
  setStorageRandomizePresets,
  setStorageShowPresetNameInControls,
  setStorageShowTrackNameInControls,
  setStorageSkipSplashOnLoad
} from '../lib/storage';

/*
 * Types.
 */

export type SettingsContextValue = {
  shouldSkipSplashOnLoad: boolean;
  setShouldSkipSplashOnLoad: (shouldSkip: boolean) => void;
  shouldRandomizePresets: boolean;
  setShouldRandomizePresets: (value: boolean) => void;
  shouldCyclePresets: boolean;
  setShouldCyclePresets: (value: boolean) => void;
  shouldShowPresetName: boolean;
  setShouldShowPresetName: (shouldShow: boolean) => void;
  shouldShowTrackName: boolean;
  setShouldShowTrackName: (shouldShow: boolean) => void;
};

/*
 * Context.
 */

const SettingsContextValue = createContext<SettingsContextValue>({
  shouldSkipSplashOnLoad: DEFAULT_SKIP_SPLASH_ON_LOAD,
  setShouldSkipSplashOnLoad: () => {},
  shouldRandomizePresets: DEFAULT_RANDOMIZE_PRESETS,
  setShouldRandomizePresets: () => {},
  shouldCyclePresets: DEFAULT_CYCLE_PRESETS,
  setShouldCyclePresets: () => {},
  shouldShowPresetName: DEFAULT_SHOW_PRESET_IN_CONTROLS,
  setShouldShowPresetName: () => {},
  shouldShowTrackName: DEFAULT_SHOW_TRACK_IN_CONTROLS,
  setShouldShowTrackName: () => {}
});

/*
 * Provider.
 */

type SettingsProviderProps = {
  children: ComponentChildren;
};

export function SettingsProvider({children}: SettingsProviderProps) {
  const [shouldSkipSplashOnLoad, setShouldSkipSplashOnLoad] = useState(
    () => getStorageSkipSplashOnLoad() ?? DEFAULT_SKIP_SPLASH_ON_LOAD
  );
  const [shouldShowPresetName, setShouldShowPresetName] = useState(
    () => getStorageShowPresetNameInControls() ?? DEFAULT_SHOW_PRESET_IN_CONTROLS
  );
  const [shouldShowTrackName, setShouldShowTrackName] = useState(
    () => getStorageShowTrackNameInControls() ?? DEFAULT_SHOW_TRACK_IN_CONTROLS
  );
  const [shouldRandomizePresets, setShouldRandomizePresets] = useState(
    () => getStorageRandomizePresets() ?? DEFAULT_RANDOMIZE_PRESETS
  );
  const [shouldCyclePresets, setShouldCyclePresets] = useState(
    () => getStorageCyclePresets() ?? DEFAULT_CYCLE_PRESETS
  );

  const setShouldSkipSplashOnLoadWithStorage = useCallback((shouldSkip: boolean) => {
    setShouldSkipSplashOnLoad(shouldSkip);
    setStorageSkipSplashOnLoad(shouldSkip);
  }, []);

  const setShouldShowPresetNameWithStorage = useCallback((shouldShow: boolean) => {
    setShouldShowPresetName(shouldShow);
    setStorageShowPresetNameInControls(shouldShow);
  }, []);
  const setShouldShowTrackNameWithStorage = useCallback((shouldShow: boolean) => {
    setShouldShowTrackName(shouldShow);
    setStorageShowTrackNameInControls(shouldShow);
  }, []);

  const setShouldRandomizePresetsWithStorage = useCallback((value: boolean) => {
    setShouldRandomizePresets(value);
    setStorageRandomizePresets(value);
  }, []);

  const setShouldCyclePresetsWithStorage = useCallback((value: boolean) => {
    setShouldCyclePresets(value);
    setStorageCyclePresets(value);
  }, []);

  return (
    <SettingsContextValue.Provider
      value={{
        shouldSkipSplashOnLoad,
        setShouldSkipSplashOnLoad: setShouldSkipSplashOnLoadWithStorage,
        shouldRandomizePresets,
        setShouldRandomizePresets: setShouldRandomizePresetsWithStorage,
        shouldCyclePresets,
        setShouldCyclePresets: setShouldCyclePresetsWithStorage,
        shouldShowPresetName,
        setShouldShowPresetName: setShouldShowPresetNameWithStorage,
        shouldShowTrackName,
        setShouldShowTrackName: setShouldShowTrackNameWithStorage
      }}
    >
      {children}
    </SettingsContextValue.Provider>
  );
}

/*
 * Hook.
 */

export function useSettingsContext(): SettingsContextValue {
  return useContext(SettingsContextValue);
}
