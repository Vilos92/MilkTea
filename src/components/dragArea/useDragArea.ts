import {useContext} from 'preact/hooks';

import {DragAreaContext, type DragAreaContextValue} from './dragAreaContext';

/*
 * Hook.
 */

export function useDragArea(): DragAreaContextValue {
  const context = useContext(DragAreaContext);
  if (!context) {
    throw new Error('useDragArea must be used within a DragArea');
  }

  return context;
}
