# Agent notes

Living conventions for this repo. Ask whether new habits belong here vs `README.md`.

## Bun

- **Bun-first** for installs and scripts (`bun install`, `bun run …`, `bun test …`). Prefer Bun equivalents when upstream docs use npm/pnpm/npx. Run **`bun install`** after pulling.
- **`bun export-presets`** runs via **`predev`** / **`prebuild`** — do not skip when validating a full build locally.

## TypeScript

- Prefer **`type` over `interface`** unless you need declaration merging (we do not).
- Prefer **`undefined` over `null`**. Model absence as `undefined`. No `?? null` unless a contract requires `null`.
- **`??` vs `||`:** **`??`** for nullish default only; **`||`** for booleans / deliberate truthiness. Empty-string-as-absent → named helper, not `value || fallback`.
- No **`x ?? undefined`** when `x` is already `T | undefined` without `null`.
- **Exports:** module-private until another file imports (or we ship a stable public API).
- **`?` vs `| undefined`:** optional props (`prop?:`) for wide/omitted keys; internal call sites use required `prop: T | undefined`. **Exception:** DOM-style props (`class?`, etc.) stay optional—omit at call sites when unused.
- **Readonly arrays** for read-only / pass-through data (`readonly T[]`).

## Imports

- **Relative paths within `src/`** — no path alias. Keep imports local to the feature tree (`../hooks/useAudioSource`, `./commandPalette.css`).
- Use **`import type`** for type-only imports (`verbatimModuleSyntax`).
- Import Vanilla Extract styles via the **`.css`** stem (e.g. `./hud.css` → `hud.css.ts`); no **`.ts` / `.tsx`** suffixes on TS module paths.

## Preact components

- Props type under **Types.** (e.g. `HudProps` in `hud.tsx`); not inline on the component when the surface is non-trivial.
- **`class`** (Preact), not `className` — omit when unused; prefer Vanilla Extract `class={styles.foo}`.
- **Providers** live in **`src/providers/`**; cross-cutting hooks in **`src/hooks/`**; shared logic in **`src/lib/`**.

## Vanilla Extract

- **`*.css.ts`** colocated with UI; shared globals in **`src/global.css.ts`** and **`src/app.css.ts`**.
- **`data-*` attribute variants over class composition.** Encode discrete state (`data-checked`, `data-disabled`, visibility) with `data-` attributes and match them in `selectors`. Do not toggle separate BEM modifier classes.
- **Runtime-varying values via `createVar` + `setElementVar`.** CSS variables that change at runtime flow through a `createVar()` in `.css.ts` and are updated by `setElementVar` from `@vanilla-extract/dynamic`. The static rule stays in `.css.ts`; only the value moves at runtime.
- **Imperative `element.style` is the last resort.** Reach for it only when neither pattern above fits.

## File layout (section comments)

**TypeScript / Vanilla Extract** (`src/**/*.ts`, `*.tsx`, colocated `*.css.ts`): section markers are **multi-line block comments** (sentence-case label + period). Blank line before and after each block, and between the comment and the code below it:

```
/*
 * Types.
 */

type Foo = …;
```

Top-down: entry first, **Helpers.** last. Skip section markers on lean single-export files where they add ceremony only.

**Order** (omit unused; no empty **Types.** / **Helpers.**):

1. **Types.** · **Enums.** · **Constants.**
2. Entry: **Script.** (`main.tsx`) | **Component.** | **Styles.** | **Config.**
3. **Hooks.**
4. **Helpers.**

**Tests:** colocate **`{module}.spec.ts`** or **`{module}.test.ts`**; **Constants.** (fixtures) → **Tests.** when the file uses section blocks.

**Storybook:** colocate **`*.stories.tsx`** beside the component under test.

## Code style

- Functional style; early returns; small helpers over deep nesting.
- Prefer **`map` / `filter` / `reduce`**; no **`forEach`**—use **`for`…`of`** (or indexed `for`) when imperative.
- **`no-nested-ternary`** and **`curly: all`** are ESLint errors—always brace blocks; no nested ternaries.
- **`@typescript-eslint/no-floating-promises`** is an error—void or await async work explicitly.

## Comments

- **Why** over **what**. Drop comments that only restate mechanics the code already shows.
- **State intent positively.** Explain what we do and why, not what we avoid or what could fail. Prefer `// ensures Y` over `// prevents X` when the code already makes X impossible.
- **Layer once.** Put shared why on a constant, type field, or entry closure. Do not repeat the same rationale at every call site.
- **JSDoc** on exports and non-trivial helpers when the contract is not obvious—often one crisp line is enough. Do not document module-private types (see **Exports**).
- In prose, backtick **identifiers** (`presetIndex`), not section headers.
- **Section blocks** (see **File layout**) label structure only — no extra explanation inside the marker.

## Naming

- **Booleans:** predicate prefixes (`is`, `has`, `did`, `should`, `can`, …) for locals, props, and fields — not bare adjectives or state nouns (`started` → `isStarted` where it denotes state).
- **Boolean predicates:** name functions that return yes/no so the call reads as a question (`canRequestFullscreen`, `hasFinePointer`, `checkIsRecording`). Prefer `can` / `has` / `check` / `should` over `getIs…` / `getShould…`—that pattern reads like a property accessor for a stored flag. Reserve **`is` / `has` / …** on functions for type guards only.
- **`compute` / `calc`** for calculated non-boolean results (`computeSearchScore`).
- **Locals:** readable names (`presetIndex`), not `e` / `x` unless scope is tiny.
- **Name for what a thing is, not where it lives.** When a folder or module already conveys context, do not restate it as an identifier prefix.

## Fail fast

- Throw with a clear message rather than run in a misleading state.
- Avoid plausible-looking placeholders for values the app cannot function without.

## Validation

**When:** large or high-impact diff (`src/`, `vite.config.ts`, PWA assets, preset export scripts); before commit.

**Loop** (stop on first failure):

1. `bun run prettier:check`
2. `bun run sort-package-json:check`
3. `bun run lint`
4. `bun run typecheck`
5. `bun run test`

**CI job → local command:**

| Job            | Local                             |
| -------------- | --------------------------------- |
| `package-json` | `bun run sort-package-json:check` |
| `prettier`     | `bun run prettier:check`          |
| `lint`         | `bun run lint`                    |
| `typecheck`    | `bun run typecheck`               |
| `test`         | `bun run test`                    |

## Keeping this file useful

When we lock in a new convention, ask whether it should be added or tightened in `AGENTS.md`.
