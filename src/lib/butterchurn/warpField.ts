/*
 * Types.
 */

/**
 * A pointer-created disturbance of the warp mesh. Positions live in screen-fraction space: `u` runs
 * 0..1 left to right and `v` runs 0..1 top to bottom, matching pointer coordinates. Butterchurn's
 * composite pass flips y at display time, which makes this the same axis the warp UV rows use.
 */
export type WarpImpulse = RippleImpulse | DragImpulse;

type RippleImpulse = {
  kind: typeof WarpImpulseKind.RIPPLE;
  u: number;
  v: number;
  startTimeMs: number;
};

type DragImpulse = {
  kind: typeof WarpImpulseKind.DRAG;
  u: number;
  v: number;
  startTimeMs: number;
  /** Unit direction of pointer motion in isotropic space (`u` scaled by aspect). */
  directionX: number;
  directionY: number;
  /** Strength in 0..1 derived from pointer speed. */
  strength: number;
};

/** Mutable output for `sampleWarpDisplacementInto`, reused so the per-vertex path stays allocation-free. */
export type WarpDisplacement = {
  du: number;
  dv: number;
};

/*
 * Enums.
 */

const WarpImpulseKind = {
  RIPPLE: 'ripple',
  DRAG: 'drag'
} as const;

/*
 * Constants.
 */

/*
 * All lengths below are isotropic: measured as fractions of the texture height, with `u` distances
 * scaled by the texture aspect first. That keeps ripples circular on non-square canvases.
 */

/** How fast a ripple ring expands, in texture heights per second. */
export const RIPPLE_SPEED = 0.35;
/** Radial thickness of the ripple ring. */
const RIPPLE_RING_WIDTH = 0.06;
/** Peak radial displacement a ripple applies each frame. */
const RIPPLE_AMPLITUDE = 0.035;
const RIPPLE_DECAY_SECONDS = 0.8;
const RIPPLE_LIFETIME_MS = 3000;

/** Radius of the gaussian falloff around a drag impulse. */
const DRAG_RADIUS = 0.13;
/** Peak displacement a full-strength drag applies each frame. */
const DRAG_AMPLITUDE = 0.06;
const DRAG_DECAY_SECONDS = 0.35;
const DRAG_LIFETIME_MS = 1000;
/** Pointer speeds below this add nothing visible, so the impulse is skipped. */
const DRAG_MIN_SPEED = 0.02;
/** Pointer speed (texture heights per second) that maps to full drag strength. */
const DRAG_FULL_STRENGTH_SPEED = 1;

/** Hard cap on live impulses so a flood of pointer events cannot grow the per-vertex loop unbounded. */
export const MAX_WARP_IMPULSES = 64;

const CENTER_EPSILON = 1e-6;

/*
 * Helpers.
 */

/** Creates a tap ripple centered at rest UV (`u`, `v`). */
export function createRippleImpulse(u: number, v: number, startTimeMs: number): WarpImpulse {
  return {kind: WarpImpulseKind.RIPPLE, u, v, startTimeMs};
}

/**
 * Creates a drag smear at rest UV (`u`, `v`) moving at (`velocityX`, `velocityY`) in isotropic units
 * per second. Returns `undefined` when the motion is too slow to matter.
 */
export function createDragImpulse(
  u: number,
  v: number,
  velocityX: number,
  velocityY: number,
  startTimeMs: number
): WarpImpulse | undefined {
  const speed = Math.hypot(velocityX, velocityY);
  if (speed < DRAG_MIN_SPEED) {
    return undefined;
  }

  return {
    kind: WarpImpulseKind.DRAG,
    u,
    v,
    startTimeMs,
    directionX: velocityX / speed,
    directionY: velocityY / speed,
    strength: Math.min(speed / DRAG_FULL_STRENGTH_SPEED, 1)
  };
}

/** Drops impulses whose effect has fully decayed. Returns the input array when nothing expired. */
export function pruneWarpImpulses(impulses: readonly WarpImpulse[], nowMs: number): readonly WarpImpulse[] {
  const alive = impulses.filter(impulse => nowMs - impulse.startTimeMs <= computeLifetimeMs(impulse));
  return alive.length === impulses.length ? impulses : alive;
}

/** Appends an impulse, dropping the oldest ones beyond `MAX_WARP_IMPULSES`. */
export function appendWarpImpulse(
  impulses: readonly WarpImpulse[],
  impulse: WarpImpulse
): readonly WarpImpulse[] {
  const appended = [...impulses, impulse];
  return appended.length > MAX_WARP_IMPULSES ? appended.slice(appended.length - MAX_WARP_IMPULSES) : appended;
}

/**
 * Accumulates into `out` the visual displacement of every impulse at rest UV (`u`, `v`), as UV
 * deltas. `aspect` is texture width over height. The caller subtracts the result from the warp
 * sample coordinates: sampling from behind the displacement makes content appear pushed along it.
 */
export function sampleWarpDisplacementInto(
  out: WarpDisplacement,
  impulses: readonly WarpImpulse[],
  u: number,
  v: number,
  aspect: number,
  nowMs: number
): void {
  out.du = 0;
  out.dv = 0;

  const sx = u * aspect;
  const sy = v;

  for (const impulse of impulses) {
    const ageSeconds = (nowMs - impulse.startTimeMs) / 1000;
    if (ageSeconds < 0) {
      continue;
    }

    const rx = sx - impulse.u * aspect;
    const ry = sy - impulse.v;
    const radius = Math.hypot(rx, ry);

    if (impulse.kind === WarpImpulseKind.RIPPLE) {
      if (radius < CENTER_EPSILON) {
        continue;
      }
      // A gaussian-derivative ring: outward push behind the front, inward pull ahead of it.
      const ringOffset = radius - RIPPLE_SPEED * ageSeconds;
      const ringShape =
        -(ringOffset / RIPPLE_RING_WIDTH) *
        Math.exp(-(ringOffset * ringOffset) / (2 * RIPPLE_RING_WIDTH * RIPPLE_RING_WIDTH));
      const magnitude = RIPPLE_AMPLITUDE * Math.exp(-ageSeconds / RIPPLE_DECAY_SECONDS) * ringShape;
      out.du += ((rx / radius) * magnitude) / aspect;
      out.dv += (ry / radius) * magnitude;
      continue;
    }

    const falloff = Math.exp(-(radius * radius) / (2 * DRAG_RADIUS * DRAG_RADIUS));
    const magnitude =
      DRAG_AMPLITUDE * impulse.strength * Math.exp(-ageSeconds / DRAG_DECAY_SECONDS) * falloff;
    out.du += (impulse.directionX * magnitude) / aspect;
    out.dv += impulse.directionY * magnitude;
  }
}

function computeLifetimeMs(impulse: WarpImpulse): number {
  return impulse.kind === WarpImpulseKind.RIPPLE ? RIPPLE_LIFETIME_MS : DRAG_LIFETIME_MS;
}
