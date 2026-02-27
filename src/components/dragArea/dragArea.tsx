import {useTranslate} from '../../provider/translation';
import {dragIndicator, dragIndicatorText, dragWrapper} from './dragArea.css';
import {DragAreaProvider} from './dragAreaProvider';
import {useDragArea} from './useDragArea';

/*
 * Types.
 */

type DragAreaProps = {
  children: preact.ComponentChildren;
  handleDrop(event: DragEvent): void;
};

type DragAreaOverlayProps = {
  children: preact.ComponentChildren;
  handleDrop(event: DragEvent): void;
};

/*
 * Components.
 */

export const DragArea = ({children, handleDrop}: DragAreaProps) => {
  return (
    <DragAreaProvider>
      <DragAreaOverlay handleDrop={handleDrop}>{children}</DragAreaOverlay>
    </DragAreaProvider>
  );
};

const DragAreaOverlay = ({children, handleDrop}: DragAreaOverlayProps) => {
  const t = useTranslate();

  const {isDragging, setIsDragging} = useDragArea();

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    handleDrop(event);
  };

  return (
    <div
      class={dragWrapper}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
      {isDragging && (
        <div class={dragIndicator} role="status" aria-live="polite">
          <span class={dragIndicatorText}>{t('dragDrop.message')}</span>
        </div>
      )}
    </div>
  );
};
