import {useState} from 'preact/hooks';

import {DragAreaContext, type DragAreaContextValue} from './dragAreaContext';

/*
 * Provider.
 */

export function DragAreaProvider({children}: {children: preact.ComponentChildren}) {
  const [isDragging, setIsDragging] = useState(false);
  const value: DragAreaContextValue = {isDragging, setIsDragging};

  return <DragAreaContext.Provider value={value}>{children}</DragAreaContext.Provider>;
}
