import {describe, expect, test} from 'vitest';

import {
  MAX_WARP_IMPULSES,
  RIPPLE_SPEED,
  type WarpDisplacement,
  type WarpImpulse,
  appendWarpImpulse,
  createDragImpulse,
  createRippleImpulse,
  pruneWarpImpulses,
  sampleWarpDisplacementInto
} from './warpField';

/*
 * Constants.
 */

const START_MS = 1_000;
const SQUARE_ASPECT = 1;
const ZERO_EPSILON = 1e-9;

/*
 * Helpers.
 */

function sample(
  impulses: readonly WarpImpulse[],
  u: number,
  v: number,
  aspect: number,
  nowMs: number
): WarpDisplacement {
  const out: WarpDisplacement = {du: 0, dv: 0};
  sampleWarpDisplacementInto(out, impulses, u, v, aspect, nowMs);
  return out;
}

/** Displacement magnitude in isotropic units, so aspect-scaled axes are comparable. */
function isotropicMagnitude(displacement: WarpDisplacement, aspect: number): number {
  return Math.hypot(displacement.du * aspect, displacement.dv);
}

/*
 * Tests.
 */

describe('sampleWarpDisplacementInto', () => {
  test('ripple displaces radially and mirror-symmetrically around its center', () => {
    const impulses = [createRippleImpulse(0.5, 0.5, START_MS)];
    const nowMs = START_MS + 150;

    const right = sample(impulses, 0.55, 0.5, SQUARE_ASPECT, nowMs);
    const left = sample(impulses, 0.45, 0.5, SQUARE_ASPECT, nowMs);

    expect(Math.abs(right.dv)).toBeLessThan(ZERO_EPSILON);
    expect(Math.abs(right.du)).toBeGreaterThan(ZERO_EPSILON);
    expect(left.du).toBeCloseTo(-right.du, 12);
    expect(Math.abs(left.dv)).toBeLessThan(ZERO_EPSILON);
  });

  test('ripple amplitude at the ring front decays over time', () => {
    const impulses = [createRippleImpulse(0.5, 0.5, START_MS)];
    const earlyAgeMs = 200;
    const lateAgeMs = 1_200;

    // Sample at a fixed offset behind each moving ring front: the ring shape factor is then
    // identical for both ages, so only the time decay differs.
    const offsetBehindFront = 0.05;
    const sampleAtFront = (ageMs: number) => {
      const radius = RIPPLE_SPEED * (ageMs / 1_000) - offsetBehindFront;
      return sample(impulses, 0.5 + radius, 0.5, SQUARE_ASPECT, START_MS + ageMs);
    };

    const early = isotropicMagnitude(sampleAtFront(earlyAgeMs), SQUARE_ASPECT);
    const late = isotropicMagnitude(sampleAtFront(lateAgeMs), SQUARE_ASPECT);

    expect(early).toBeGreaterThan(ZERO_EPSILON);
    expect(late).toBeLessThan(early);
  });

  test('ripples stay circular under a non-square aspect', () => {
    const aspect = 2;
    const impulses = [createRippleImpulse(0.5, 0.5, START_MS)];
    const nowMs = START_MS + 150;
    const isotropicDistance = 0.06;

    // Two points at the same isotropic distance: one offset along u, one along v.
    const alongU = sample(impulses, 0.5 + isotropicDistance / aspect, 0.5, aspect, nowMs);
    const alongV = sample(impulses, 0.5, 0.5 + isotropicDistance, aspect, nowMs);

    expect(isotropicMagnitude(alongU, aspect)).toBeCloseTo(isotropicMagnitude(alongV, aspect), 12);
  });

  test('drag displaces along its direction of motion and falls off with distance', () => {
    const impulse = createDragImpulse(0.5, 0.5, 1, 0, START_MS);
    expect(impulse).toBeDefined();
    const impulses = [impulse as WarpImpulse];
    const nowMs = START_MS + 50;

    const near = sample(impulses, 0.52, 0.5, SQUARE_ASPECT, nowMs);
    const far = sample(impulses, 0.9, 0.5, SQUARE_ASPECT, nowMs);

    expect(near.du).toBeGreaterThan(ZERO_EPSILON);
    expect(Math.abs(near.dv)).toBeLessThan(ZERO_EPSILON);
    expect(Math.abs(far.du)).toBeLessThan(near.du);
  });
});

describe('createDragImpulse', () => {
  test('returns undefined for negligible motion', () => {
    expect(createDragImpulse(0.5, 0.5, 0, 0, START_MS)).toBeUndefined();
    expect(createDragImpulse(0.5, 0.5, 0.001, 0.001, START_MS)).toBeUndefined();
  });
});

describe('pruneWarpImpulses', () => {
  test('keeps fresh impulses and returns the same array when nothing expired', () => {
    const impulses = [createRippleImpulse(0.5, 0.5, START_MS)];
    expect(pruneWarpImpulses(impulses, START_MS + 100)).toBe(impulses);
  });

  test('drops impulses after their lifetime', () => {
    const impulses = [
      createRippleImpulse(0.5, 0.5, START_MS),
      createDragImpulse(0.5, 0.5, 1, 0, START_MS) as WarpImpulse
    ];
    expect(pruneWarpImpulses(impulses, START_MS + 10_000)).toHaveLength(0);
  });
});

describe('appendWarpImpulse', () => {
  test('caps the impulse count by dropping the oldest', () => {
    let impulses: readonly WarpImpulse[] = [];
    for (let i = 0; i <= MAX_WARP_IMPULSES; i++) {
      impulses = appendWarpImpulse(impulses, createRippleImpulse(0.5, 0.5, START_MS + i));
    }

    expect(impulses).toHaveLength(MAX_WARP_IMPULSES);
    expect(impulses[0].startTimeMs).toBe(START_MS + 1);
  });
});
