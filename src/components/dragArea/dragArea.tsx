import {useTranslate} from '../../provider/translation';
import {dragIndicator, dragIndicatorText, dragWrapper} from './dragArea.css';
import {DragAreaProvider} from './dragAreaProvider';
import {useDragArea} from './useDragArea';

/*
 * Types.
 */

type DragAreaProps = {
  children: preact.ComponentChildren;
};

type DragAreaOverlayProps = {
  children: preact.ComponentChildren;
};

/*
 * Components.
 */

export const DragArea = ({children}: DragAreaProps) => {
  return (
    <DragAreaProvider>
      <DragAreaOverlay>{children}</DragAreaOverlay>
    </DragAreaProvider>
  );
};

const DragAreaOverlay = ({children}: DragAreaOverlayProps) => {
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

    const files = event.dataTransfer?.files ?? [];
    console.log('Uploaded files:', files);
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
