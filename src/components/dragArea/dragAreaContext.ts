import {createContext} from 'preact';

/*
 * Types.
 */

export type DragAreaContextValue = {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

/*
 * Context.
 */

export const DragAreaContext = createContext<DragAreaContextValue | undefined>({
  isDragging: false,
  setIsDragging: () => {}
});
