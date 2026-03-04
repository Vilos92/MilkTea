import {createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useCallback, useContext, useState} from 'preact/hooks';

import {
  DEFAULT_SHOW_PRESET_NAME_ON_CHANGE,
  DEFAULT_SHOW_TRACK_NAME_ON_CHANGE,
  DEFAULT_SKIP_SPLASH_ON_LOAD
} from '../lib/settings';
import {
  getStorageShowPresetNameOnChange,
  getStorageShowTrackNameOnChange,
  getStorageSkipSplashOnLoad,
  setStorageShowPresetNameOnChange,
  setStorageShowTrackNameOnChange,
  setStorageSkipSplashOnLoad
} from '../lib/storage';

/*
 * Types.
 */

export type SettingsContextValue = {
  shouldSkipSplashOnLoad: boolean;
  setShouldSkipSplashOnLoad: (shouldSkip: boolean) => void;
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
  shouldShowPresetName: DEFAULT_SHOW_PRESET_NAME_ON_CHANGE,
  setShouldShowPresetName: () => {},
  shouldShowTrackName: DEFAULT_SHOW_TRACK_NAME_ON_CHANGE,
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
    () => getStorageShowPresetNameOnChange() ?? DEFAULT_SHOW_PRESET_NAME_ON_CHANGE
  );
  const [shouldShowTrackName, setShouldShowTrackName] = useState(
    () => getStorageShowTrackNameOnChange() ?? DEFAULT_SHOW_TRACK_NAME_ON_CHANGE
  );

  const setShouldSkipSplashOnLoadWithStorage = useCallback((shouldSkip: boolean) => {
    setShouldSkipSplashOnLoad(shouldSkip);
    setStorageSkipSplashOnLoad(shouldSkip);
  }, []);

  const setShouldShowPresetNameWithStorage = useCallback((shouldShow: boolean) => {
    setShouldShowPresetName(shouldShow);
    setStorageShowPresetNameOnChange(shouldShow);
  }, []);
  const setShouldShowTrackNameWithStorage = useCallback((shouldShow: boolean) => {
    setShouldShowTrackName(shouldShow);
    setStorageShowTrackNameOnChange(shouldShow);
  }, []);

  return (
    <SettingsContextValue.Provider
      value={{
        shouldSkipSplashOnLoad,
        setShouldSkipSplashOnLoad: setShouldSkipSplashOnLoadWithStorage,
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
