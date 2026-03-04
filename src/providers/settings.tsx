import {createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useContext, useState} from 'preact/hooks';

/*
 * Types.
 */

export type SettingsContextValue = {
  shouldShowPresetName: boolean;
  setShouldShowPresetName: (shouldShow: boolean) => void;
  shouldShowTrackName: boolean;
  setShouldShowTrackName: (shouldShow: boolean) => void;
};

/*
 * Context.
 */

const SettingsContextValue = createContext<SettingsContextValue>({
  shouldShowPresetName: true,
  setShouldShowPresetName: () => {},
  shouldShowTrackName: true,
  setShouldShowTrackName: () => {}
});

/*
 * Provider.
 */

type SettingsProviderProps = {
  children: ComponentChildren;
};

export function SettingsProvider({children}: SettingsProviderProps) {
  const [shouldShowPresetName, setShouldShowPresetName] = useState(true);
  const [shouldShowTrackName, setShouldShowTrackName] = useState(true);

  return (
    <SettingsContextValue.Provider
      value={{
        shouldShowPresetName,
        setShouldShowPresetName,
        shouldShowTrackName,
        setShouldShowTrackName
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
