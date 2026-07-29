<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Agent notes

Living conventions for this repo. Ask whether new habits belong here vs `README.md`.

## Bun

- **Bun-first** for installs and scripts (`bun install`, `bun run …`). Day-to-day app tooling uses **`vp`** (`vp dev`, `vp check`, `vp test`) per Vite+ above.
- Prefer Bun (or **`vp`**) equivalents when upstream docs use npm/pnpm/npx. Run **`bun install`** after pulling.
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

Do **not** collapse these to single-line `/* Types. */`.

Top-down: entry first, **Helpers.** last. Skip section markers on lean single-export files where they add ceremony only.

**Order** (omit unused; no empty **Types.** / **Helpers.**):

1. **Types.** · **Enums.** · **Constants.** · **Scratch.**
2. Entry: **Script.** (`main.tsx`) | **Component.** | **Styles.** | **Config.**
3. **Hooks.**
4. **Helpers.**

**Scratch.** holds module-scope state that gets mutated — including a `const` whose properties are mutated. It sits directly above the entry section.

**Config** (`vite.config.ts`, `pwa-assets.config.ts`): **Constants.** → **Config.** (default export). Module-level `const` above the entry; only `function` helpers may follow (hoisting).

**Lean files** (one export, few lines): one matching entry block is enough.

**Tests:** colocate **`{module}.spec.ts`** or **`{module}.test.ts`**; **Constants.** (fixtures) → **Tests.** when the file uses section blocks.

**Storybook:** colocate **`*.stories.tsx`** beside the component under test.

## Code style

- Functional style; early returns; small helpers over deep nesting.
- Prefer **`map` / `filter` / `reduce`**; no **`forEach`**—use **`for`…`of`** (or indexed `for`) when imperative.
- **`no-nested-ternary`** and **`curly: all`** are Oxlint errors (via `vp check`)—always brace blocks; no nested ternaries.
- **`typescript/no-floating-promises`** is an error—void or await async work explicitly. It runs type-aware through `tsgolint`, so it needs `lint.options.typeAware` in `vite.config.ts`.

## Comments

- **Why** over **what**. Drop comments that only restate mechanics the code already shows.
- **State intent positively.** Explain what we do and why, not what we avoid or what could fail. Prefer `// ensures Y` over `// prevents X` when the code already makes X impossible.
- **Layer once.** Put shared why on a constant, type field, or entry closure. Do not repeat the same rationale at every call site.
- **JSDoc** on exports and non-trivial helpers when the contract is not obvious—often one crisp line is enough. Do not document module-private types (see **Exports**).
- In prose, backtick **identifiers** (`presetIndex`), not section headers.
- Default to **separate sentences** over semicolons or em dashes joining clauses. Either is fine occasionally for a tight parenthetical, but overuse gives the codebase a heavy editorial voice.
- **Balance line widths** in multi-line comments, and never wrap mid-token (`display: none` stays on one line).
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

1. `vp check` — fmt, lint, typecheck
2. `vp test`
3. `bun run fallow:audit` (CI: `--base` on PRs; see workflow)

`vp fmt` also sorts `package.json` and import blocks, which is why there is no separate Prettier or `sort-package-json` step.

**CI job → local command:**

| Job         | Local                  |
| ----------- | ---------------------- |
| `fmt`       | `bun run fmt:check`    |
| `lint`      | `bun run lint`         |
| `typecheck` | `bun run typecheck`    |
| `test`      | `bun run test`         |
| `fallow`    | `bun run fallow:audit` |

## Fallow

Oxlint (`vp lint`) does **not** replace Fallow for cross-file unused exports.

- Fix, add an **`entry`** in **`.fallowrc.jsonc`**, or delete—no greenwash. Ask the human before permanent ignores or baselines.
- Track suppressions in **`.fallowrc.jsonc`**, not as inline `fallow-ignore` comments.
- Baselines **`.fallow/dupes-baseline.json`** / **`.fallow/health-baseline.json`** are versioned. Refresh with `fallow health --save-baseline <path>` / `fallow dupes --save-baseline <path>` after human review—not by default when audit fails.
- **`private-type-leaks`** and **`duplicate-exports`** are off by house rule; see the comments in **`.fallowrc.jsonc`**.

## Keeping this file useful

When we lock in a new convention, ask whether it should be added or tightened in `AGENTS.md`.
