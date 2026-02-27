import {createContext} from 'preact';

/*
 * Context.
 */

export type DragAreaContextValue = {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

export const DragAreaContext = createContext<DragAreaContextValue | undefined>({
  isDragging: false,
  setIsDragging: () => {}
});
