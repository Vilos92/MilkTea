import type {Visualizer} from './butterchurn';
import {
  type WarpDisplacement,
  type WarpImpulse,
  appendWarpImpulse,
  createDragImpulse,
  createRippleImpulse,
  pruneWarpImpulses,
  sampleWarpDisplacementInto
} from './warpField';

/*
 * Types.
 */

/**
 * The slice of butterchurn's private renderer that the warp patch relies on. Butterchurn ships no
 * types and no interaction API, so this rides on internals verified against butterchurn 2.6.7.
 */
type WarpRenderer = {
  mesh_width: number;
  mesh_height: number;
  texsizeX: number;
  texsizeY: number;
  blending: boolean;
  warpUVs: Float32Array;
  runPixelEquations: (preset: unknown, mdVSFrame: unknown, runVertEQs: unknown, blending: boolean) => void;
};

export type WarpInteraction = {
  /** Spawns a ripple at canvas fraction (`fx`, `fy`), measured from the top-left corner. */
  addRipple: (fx: number, fy: number) => void;
  /** Adds a drag smear at canvas fraction (`fx`, `fy`) moving at (`vfx`, `vfy`) fractions per second. */
  addDrag: (fx: number, fy: number, vfx: number, vfy: number) => void;
  /** Restores the original renderer method and drops all live impulses. */
  detach: () => void;
};

/*
 * Helpers.
 */

/**
 * Patches the visualizer's renderer so pointer impulses displace the warp mesh. After the preset's
 * per-vertex equations fill `warpUVs` each frame, the active impulses' displacement field is
 * subtracted from the sample coordinates. The frame feedback loop then carries the disturbance,
 * which is what makes it read as part of the preset. Throws when the renderer internals do not
 * match, so callers can degrade gracefully.
 */
export function createWarpInteraction(visualizer: Visualizer): WarpInteraction {
  const renderer = extractWarpRenderer(visualizer);

  let impulses: readonly WarpImpulse[] = [];
  const scratch: WarpDisplacement = {du: 0, dv: 0};

  const applyImpulses = (): void => {
    const nowMs = performance.now();
    impulses = pruneWarpImpulses(impulses, nowMs);
    if (impulses.length === 0) {
      return;
    }

    // Read the mesh fields fresh every frame: `setRendererSize` and `setInternalMeshSize`
    // reallocate `warpUVs`, so a cached reference would go stale.
    const meshWidth = renderer.mesh_width;
    const meshHeight = renderer.mesh_height;
    const warpUVs = renderer.warpUVs;
    const aspect = renderer.texsizeX / renderer.texsizeY;

    let offset = 0;
    for (let iz = 0; iz <= meshHeight; iz++) {
      // The composite pass flips y when drawing to screen (MilkDrop's y-down convention), so mesh
      // row `iz` displays at screen fraction `1 - iz / meshHeight` from the top. That value also
      // equals the row's rest UV `v`, so impulse space and warp UV space share the axis.
      const v = 1 - iz / meshHeight;
      for (let ix = 0; ix <= meshWidth; ix++) {
        sampleWarpDisplacementInto(scratch, impulses, ix / meshWidth, v, aspect, nowMs);
        warpUVs[offset] -= scratch.du;
        warpUVs[offset + 1] -= scratch.dv;
        offset += 2;
      }
    }
  };

  const original = renderer.runPixelEquations;
  renderer.runPixelEquations = (preset, mdVSFrame, runVertEQs, blending) => {
    original.call(renderer, preset, mdVSFrame, runVertEQs, blending);
    // During a preset blend the equations run twice per frame (new preset, then old). Only the
    // final pass may be displaced, or the blend mix would re-weight and double-apply the offsets.
    if (blending === renderer.blending) {
      applyImpulses();
    }
  };

  return {
    addRipple: (fx, fy) => {
      impulses = appendWarpImpulse(impulses, createRippleImpulse(fx, fy, performance.now()));
    },
    addDrag: (fx, fy, vfx, vfy) => {
      // Velocities are made isotropic (x scaled by aspect) before the impulse derives direction
      // and strength.
      const aspect = renderer.texsizeX / renderer.texsizeY;
      const impulse = createDragImpulse(fx, fy, vfx * aspect, vfy, performance.now());
      if (impulse) {
        impulses = appendWarpImpulse(impulses, impulse);
      }
    },
    detach: () => {
      renderer.runPixelEquations = original;
      impulses = [];
    }
  };
}

const REQUIRED_NUMERIC_FIELDS = ['mesh_width', 'mesh_height', 'texsizeX', 'texsizeY'] as const;

function extractWarpRenderer(visualizer: Visualizer): WarpRenderer {
  const renderer = (visualizer as {renderer?: Partial<WarpRenderer>} | null)?.renderer;
  if (!checkIsWarpRenderer(renderer)) {
    throw new Error('Butterchurn renderer internals changed. Cannot attach warp interaction.');
  }
  return renderer;
}

function checkIsWarpRenderer(renderer: Partial<WarpRenderer> | undefined): renderer is WarpRenderer {
  if (typeof renderer?.runPixelEquations !== 'function' || !(renderer.warpUVs instanceof Float32Array)) {
    return false;
  }
  return REQUIRED_NUMERIC_FIELDS.every(field => typeof renderer[field] === 'number');
}
