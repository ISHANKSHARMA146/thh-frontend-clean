---
name: thh-frontend-clean
description: >-
  Enforce clean, fast, DRY, AI-friendly frontend code for the THH stack:
  Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, TanStack Query
  v5, Zustand v5, react-hook-form + Zod, shadcn/ui, Radix. Use whenever
  building, refactoring, reviewing, or cleaning up ANY frontend code in this
  repo — components, pages, hooks, stores, forms, data fetching, styling, or
  project structure — even if the user does not say "clean". Trigger on "build
  a component/page/feature", "add a data hook", "create a form", "wire up an
  API call", "refactor this", "clean up", "reduce duplication", "make this
  faster", "fix re-renders", "fix the state", "set up lint/format/types", or
  any "/thh-frontend-clean" invocation. Encodes version-specific traps: async
  params and opt-in caching in Next 15, ref-as-prop and the React Compiler in
  React 19, CSS-first @theme in Tailwind v4, useShallow and slices in Zustand
  5, query-key factories in TanStack Query 5.
---

# THH Frontend — Clean & Fast

Produce frontend code that is **clean, minimal, fast, and easy for both humans and AI agents to navigate**. The goal is fewer lines, zero duplication, no dead weight, and patterns so consistent that the next contributor (human or model) can copy the nearest example and be correct.

**Most "quality" is enforced by tooling, not by reading rules.** If a linter, formatter, or the type checker can catch it, that is where it belongs — see `references/tooling.md` and the ready-to-use configs in `assets/`. This skill covers what tools cannot infer: architecture, state placement, composition, and version-specific gotchas.

## How to use this skill

1. Identify the task: **build** new code, **clean/refactor** existing code, or **set up** repo tooling.
2. Apply the **Golden rules** below to everything — they prevent the bulk of duplication and bugs.
3. Read **only the reference file(s)** for the area you are touching (table below). Do not load them all.
4. **Match the codebase first.** Before writing, look at the nearest existing example (a sibling hook, store slice, form, or component) and copy its shape. Consistency beats novelty.
5. Finish by running `pnpm typecheck` and `pnpm lint --fix`. Do not call a task done until both pass.

### Which reference to read

| Working on… | Read |
|---|---|
| Data fetching, mutations, global/client state, re-renders | `references/state.md` |
| Pages, layouts, routing, Server Components, Server Actions, caching | `references/nextjs.md` |
| Components, hooks, JSX, the new React 19 hooks, memoization | `references/react.md` |
| Styling, Tailwind classes, theme tokens, variants, dark mode | `references/styling.md` |
| Forms, validation, schemas | `references/forms.md` |
| File structure, composition, shadcn, reducing duplication | `references/components-structure.md` |
| Bundle size, lazy loading, lists/tables, perceived speed | `references/performance.md` |
| ESLint, Prettier, TypeScript, env validation, pre-commit | `references/tooling.md` |

## Golden rules (always apply)

These are the load-bearing rules. They are short on purpose.

1. **Put state in exactly one place.** Server data → TanStack Query. Global client/UI state → Zustand. Local UI state → `useState`. Shareable view state (filters, tab, page, sort) → URL search params. **Never copy server data into Zustand or `useState`.** This single rule prevents most duplication and sync bugs. (Details: `references/state.md`.)

2. **Server-first.** In the App Router, components are Server Components by default. Add `"use client"` only on the smallest leaf that needs interactivity, and push it as far down the tree as possible. Fetch data in Server Components; pass it down as props. (Details: `references/nextjs.md`.)

3. **One source of truth per concept.** One Zod schema per form/payload (`z.infer` for the type — never hand-write a parallel type). One query-key factory per feature. One `cn()` for class merging. One shadcn primitive per UI element. Derive; do not duplicate.

4. **Compose, don't repeat.** Reach for `cva` variants, Radix `Slot`/`asChild`, `children`, and small components before copy-pasting markup or writing conditional `className` soup. Apply the rule of three: dedupe real repetition, but don't pre-abstract a single use.

5. **Let the compiler do the work.** If the React Compiler is enabled, do **not** hand-write `useMemo`, `useCallback`, or `React.memo`. Type everything; `any` is a defect. Prefer named exports (Next's required default `page`/`layout`/`route` exports are the only exception).

6. **Respect the version.** This stack has several traps that older training data gets wrong — see the cheat sheet next. When unsure, read the reference rather than guessing.

## Version cheat sheet (the traps)

- **Next 15** — `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are **async; `await` them**. `fetch` and GET route handlers are **not cached by default** (opt in with `{ next: { revalidate } }` or `cache: 'force-cache'`). Mutations are Server Actions + `revalidatePath`/`revalidateTag`.
- **React 19** — `ref` is a normal prop; **no `forwardRef`**. Forms: `useActionState` (not `useFormState`), `useFormStatus`, `useOptimistic`. Read promises/context with `use()`.
- **Tailwind v4** — **no `tailwind.config.js`**; tokens live in CSS under `@theme` (`--color-*`, `--spacing`, `--radius-*`). Entry is `@import "tailwindcss"`. Merge classes with `cn()`; build variants with `cva`. The default shadow/radius scale was renamed (`shadow` → `shadow-sm`, etc.).
- **TanStack Query v5** — single options object; keys from the factory. Renames: `cacheTime`→`gcTime`, `keepPreviousData`→`placeholderData: keepPreviousData`, `useErrorBoundary`→`throwOnError`.
- **Zustand v5** — multi-value selectors must use `useShallow` (the equality-fn argument was **removed**). Export hooks/atomic selectors, never the raw store.

## Cleaning / refactoring checklist

When the task is to clean up existing code, scan for and fix these — they are the highest-yield wins:

- Server data sitting in Zustand or `useState` → move to a TanStack Query hook.
- Ad-hoc query key strings → replace with the feature key factory.
- Hand-written types that mirror a Zod schema → replace with `z.infer`.
- `className={\`... ${cond ? 'a' : 'b'} ...\`}` soup → `cn()` + `cva`.
- Manual `useMemo`/`useCallback`/`memo` where the compiler is on → remove.
- Large client components that could be Server Components → split; shrink the `"use client"` boundary.
- Duplicated markup across components → extract a component or compound component.
- `forwardRef` wrappers (React 19) → take `ref` as a prop.
- `tailwind.config.js` theme values not migrated → move to `@theme` in the global CSS.
- Multi-value Zustand selectors without `useShallow` → wrap them.
- Dead code, unused exports, commented-out blocks, unused deps → delete.
- Heavy client-only libs (editors, charts, dnd) imported eagerly → `next/dynamic`.

Make the smallest change that fixes the issue. Don't rewrite working code for style alone.

## Setting up repo tooling

When asked to make the repo AI-/developer-friendly or to set up linting/formatting/types, copy the ready configs from `assets/` and follow `references/tooling.md`:

- `assets/eslint.config.mjs` — flat ESLint config (encodes the conventions so violations auto-flag).
- `assets/prettier.config.mjs` — Prettier + automatic Tailwind class sorting.
- `assets/lib/utils.ts` — the canonical `cn()` helper.
- `assets/env.ts` — type-safe, validated environment variables.
- `assets/AGENTS.md.template` — a **lean** repo-root instruction file to pair with this skill (rename to `AGENTS.md`, then `ln -s AGENTS.md CLAUDE.md` so every tool reads one source). Keep it short; this skill carries the depth.
- `assets/SETUP.md` — package.json scripts + husky/lint-staged pre-commit wiring.

Do not create large prose docs beyond these. Context files that restate what tooling already enforces hurt agent performance; keep the always-on layer thin and let this skill supply detail on demand.
