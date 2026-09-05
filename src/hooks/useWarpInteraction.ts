import type {RefObject} from 'preact';
import {useEffect, useRef} from 'preact/hooks';

import type {WarpInteraction} from '../lib/butterchurn/warpInteraction';

/*
 * Types.
 */

type PointerSample = {
  fx: number;
  fy: number;
  timeMs: number;
};

type DragSample = {
  next: PointerSample;
  vfx: number;
  vfy: number;
};

/*
 * Constants.
 */

/** Minimum spacing between drag impulses so a fast pointer does not flood the displacement field. */
const DRAG_SAMPLE_INTERVAL_MS = 16;

const MS_PER_SECOND = 1000;

/*
 * Hook.
 */

/**
 * Wires pointer input on the visualizer canvas into the warp interaction: pressing spawns a ripple,
 * and dragging smears the frame along the pointer path.
 */
export function useWarpInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  interactionRef: RefObject<WarpInteraction | null>
): void {
  const pointerSampleRef = useRef<PointerSample | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || !event.isPrimary) {
        return;
      }
      canvas.setPointerCapture(event.pointerId);
      const {fx, fy} = computeCanvasFractions(canvas, event);
      pointerSampleRef.current = {fx, fy, timeMs: event.timeStamp};
      interaction.addRipple(fx, fy);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const sample = computeDragSample(canvas, pointerSampleRef.current, event);
      if (!sample) {
        return;
      }
      interactionRef.current?.addDrag(sample.next.fx, sample.next.fy, sample.vfx, sample.vfy);
      pointerSampleRef.current = sample.next;
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (!event.isPrimary) {
        return;
      }
      pointerSampleRef.current = null;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerEnd);
    canvas.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerEnd);
      canvas.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [canvasRef, interactionRef]);
}

/*
 * Helpers.
 */

function computeCanvasFractions(canvas: HTMLCanvasElement, event: PointerEvent): {fx: number; fy: number} {
  const rect = canvas.getBoundingClientRect();
  return {
    fx: (event.clientX - rect.left) / rect.width,
    fy: (event.clientY - rect.top) / rect.height
  };
}

/** Turns a pointer move into a drag sample, or `undefined` while dragging is inactive or throttled. */
function computeDragSample(
  canvas: HTMLCanvasElement,
  previous: PointerSample | null,
  event: PointerEvent
): DragSample | undefined {
  if (!previous || !event.isPrimary) {
    return undefined;
  }
  const elapsedMs = event.timeStamp - previous.timeMs;
  if (elapsedMs < DRAG_SAMPLE_INTERVAL_MS) {
    return undefined;
  }
  const {fx, fy} = computeCanvasFractions(canvas, event);
  return {
    next: {fx, fy, timeMs: event.timeStamp},
    vfx: ((fx - previous.fx) * MS_PER_SECOND) / elapsedMs,
    vfy: ((fy - previous.fy) * MS_PER_SECOND) / elapsedMs
  };
}
