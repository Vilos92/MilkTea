import {createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useCallback, useContext, useEffect, useState} from 'preact/hooks';

/*
 * Types.
 */

export type MilkTeaPanel = (typeof MilkTeaPanel)[keyof typeof MilkTeaPanel];

export type PanelContextValue = {
  openPanel: MilkTeaPanel;
  setOpenPanel: (panel: MilkTeaPanel | ((prev: MilkTeaPanel) => MilkTeaPanel)) => void;
  togglePanel: (panel: Exclude<MilkTeaPanel, 'NONE'>) => void;
};

type PanelProviderProps = {
  children: ComponentChildren;
};

/*
 * Enums.
 */

export const MilkTeaPanel = {
  COMMAND_PALETTE: 'COMMAND_PALETTE',
  HELP: 'HELP',
  PRESET_PICKER: 'PRESET_PICKER',
  NONE: 'NONE'
} as const;

/*
 * Context.
 */

const PanelContext = createContext<PanelContextValue>({
  openPanel: MilkTeaPanel.NONE,
  setOpenPanel: () => {},
  togglePanel: () => {}
});

/*
 * Provider.
 */

export function PanelProvider({children}: PanelProviderProps) {
  const [openPanel, setOpenPanel] = useState<MilkTeaPanel>(MilkTeaPanel.NONE);

  const togglePanel = useCallback((panel: Exclude<MilkTeaPanel, 'NONE'>) => {
    setOpenPanel(prev => (prev === panel ? MilkTeaPanel.NONE : panel));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        togglePanel(MilkTeaPanel.COMMAND_PALETTE);
        return;
      }
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        togglePanel(MilkTeaPanel.HELP);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [togglePanel]);

  return (
    <PanelContext.Provider value={{openPanel, setOpenPanel, togglePanel}}>{children}</PanelContext.Provider>
  );
}

/*
 * Hook.
 */

export function usePanelContext(): PanelContextValue {
  return useContext(PanelContext);
}
