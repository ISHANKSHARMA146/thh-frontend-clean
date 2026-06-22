---
name: thh-fe-audit
description: >-
  AUDIT-ONLY mode for the THH frontend (Next.js 15 App Router, React 19,
  TypeScript, Tailwind v4, TanStack Query v5, Zustand v5, react-hook-form +
  Zod, shadcn/Radix, plus the repo's services layer, next-auth, Sanity,
  TanStack Table/Virtual, socket.io, dnd-kit, recharts, posthog). Reads the
  code and reports clean/fast/DRY/AI-friendly violations as a tiered report
  with file:line and a suggested fix — it CHANGES NOTHING. Use to review a
  component/page/hook/store/service/form before touching it, to scope a
  cleanup, or for PR review. Trigger on "/thh-fe-audit", "audit the frontend",
  "review this component", "what's wrong with this page", "find duplication",
  "where are the god-files", "is this clean". To APPLY fixes, use the sibling
  /thh-fe-code skill after this audit.
---

# THH Frontend — Audit (read-only)

Find what makes the frontend un-clean, slow, duplicated, or hard for humans and AI agents to navigate — and **report it**. This mode **does not edit, create, or delete anything.** It produces a tiered findings report with `file:line` and a one-line suggested fix per finding. Applying fixes is the job of the sibling **`/thh-fe-code`** skill.

The standard: fewer lines, zero duplication, no dead weight, patterns consistent enough that the next contributor (human or model) copies the nearest example and is correct.

## Mode contract (hard rule)

- **Read-only.** Use Read/Grep/Glob and graph tools. Do **not** call Edit/Write, do not run formatters/fixers, do not commit. If the user asks you to fix during an audit, point them to `/thh-fe-code`.
- Output is a **report**, not a diff. Every finding is actionable and located.
- Don't boil the ocean. If given a file/folder, audit that scope. If given the whole repo, sample the highest-risk areas (services, large components, stores) and say what you sampled.

## How to run an audit

1. **Scope.** Identify what to audit: a file, a feature folder, changed files, or a sampled sweep. State the scope at the top of the report.
2. **Map first (cheap).** Prefer the `code-review-graph` MCP tools (`detect_changes`, `get_review_context`, `query_graph`, `semantic_search_nodes`) over raw file scanning — they're faster and give callers/dependents/tests. Fall back to Grep/Glob/Read only for what the graph doesn't cover.
3. **Apply the rule set** below (Golden rules + version traps + the per-area references) to the scope.
4. **Read only the reference(s)** for the areas in scope (table below) — not all of them.
5. **Write the report** in the format at the bottom. Stop. Do not change code.

### Which reference to read

| Working on… | Read |
|---|---|
| **Services, `authenticatedFetch`, fetching, caching, query keys, prefetch** | `references/data-layer.md` |
| Data fetching vs global/client state, re-renders, Zustand slices | `references/state.md` |
| Pages, layouts, routing, Server Components, Server Actions, caching | `references/nextjs.md` |
| Components, hooks, JSX, React 19 hooks, memoization | `references/react.md` |
| Styling, Tailwind classes, theme tokens, variants, dark mode | `references/styling.md` |
| Forms, validation, schemas | `references/forms.md` |
| File structure, composition, shadcn, god-files, reducing duplication | `references/components-structure.md` |
| Bundle size, lazy loading, lists/tables, perceived speed | `references/performance.md` |
| **next-auth, Sanity, TanStack Table/Virtual, socket.io, dnd-kit, recharts, posthog, duplicate libs** | `references/integrations.md` |
| **AI slop, generic code, design tokens, reinvented primitives, following our patterns** | `references/anti-ai-slop.md` |
| ESLint, Prettier, TypeScript, env validation, pre-commit | `references/tooling.md` |

## Golden rules (what you're auditing against)

1. **State in exactly one place.** Server data → TanStack Query. Global client/UI state → Zustand. Local UI state → `useState`. Shareable view state (filters, tab, page, sort) → URL search params. **Never copy server data into Zustand or `useState`.** (`references/state.md`, `references/data-layer.md`.)
2. **Server-first.** Server Components by default; `"use client"` only on the smallest interactive leaf, pushed as far down as possible. (`references/nextjs.md`.)
3. **One source of truth per concept.** One Zod schema (`z.infer` for the type), one query-key factory per feature, one `cn()`, one shadcn primitive per UI element, one fetch wrapper + base URL. Derive; don't duplicate.
4. **Compose, don't repeat.** `cva` variants, Radix `Slot`/`asChild`, `children`, small components before copy-paste or `className` soup. Rule of three.
5. **One library per job.** Two packages doing the same thing is a defect — flag it. (See the known duplicates in `references/integrations.md`: `framer-motion`+`motion`, Tiptap+Lexical, multiple select libs.)
6. **No god-files.** Component >~300 lines, service >~400, store >~300, hook >~150 → finding. (`references/components-structure.md`.)
7. **Let the compiler do the work.** If the React Compiler is on, no hand-written `useMemo`/`useCallback`/`React.memo`. Type everything; `any` is a defect. Named exports (Next's default `page`/`layout`/`route` are the only exception).
8. **Respect the version.** The traps below are what older training data gets wrong.
9. **Follow the breadcrumbs — no AI slop.** Match THH's system design, design tokens (`--color-ink`/`--color-paper`/`--color-brand`, Fraunces serif), and existing `components/ui/` primitives. Flag reinvented primitives, hardcoded design values (`gray-*`/`white`/hex/Inter/purple), defensive try-catch bloat, `any`/casts, redundant comments, unstable keys, missing loading/empty/error states, and the generic-SaaS look. (`references/anti-ai-slop.md`. Deep enforcement: the `/thh-fe-antiai` skill.)

## Version cheat sheet (the traps)

- **Next 15** — `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are **async; `await` them**. `fetch`/GET handlers **not cached by default** (opt in with `{ next: { revalidate } }` / `cache: 'force-cache'`). Mutations = Server Actions + `revalidatePath`/`revalidateTag`.
- **React 19** — `ref` is a normal prop; **no `forwardRef`**. Forms: `useActionState` (not `useFormState`), `useFormStatus`, `useOptimistic`. Read promises/context with `use()`.
- **Tailwind v4** — **no `tailwind.config.js`**; tokens in CSS under `@theme`. Entry `@import "tailwindcss"`. Merge with `cn()`, variants with `cva`. Shadow/radius scale renamed (`shadow`→`shadow-sm`).
- **TanStack Query v5** — single options object; keys from the factory. `cacheTime`→`gcTime`, `keepPreviousData`→`placeholderData: keepPreviousData`, `useErrorBoundary`→`throwOnError`. Default `staleTime` is `0` (set it for prefetched data).
- **Zustand v5** — multi-value selectors need `useShallow` (equality-fn arg removed). Export hooks/atomic selectors, never the raw store.

## What to scan for (highest-yield findings)

- Server data in Zustand/`useState` → should be a TanStack Query hook.
- Thick service fns with business logic; god-services >400 lines; duplicated `API_BASE_URL`/auth headers. (`references/data-layer.md`.)
- Ad-hoc query-key strings → factory.
- Hand-written types mirroring a Zod schema → `z.infer`.
- `className={\`... ${cond?'a':'b'} ...\`}` soup → `cn()` + `cva`.
- Manual `useMemo`/`useCallback`/`memo` where the compiler is on.
- Large client components that could be Server Components; oversized `"use client"` boundary.
- Duplicated markup → extract component/compound component.
- `forwardRef` wrappers (React 19) → ref-as-prop.
- `tailwind.config.js` theme values not migrated to `@theme`.
- Multi-value Zustand selectors missing `useShallow`.
- Duplicate-purpose deps (`framer-motion` vs `motion`, two editors, many select libs).
- Heavy client-only libs (editors, charts, dnd, Calendly) imported eagerly → `next/dynamic`.
- God-files over the size caps.
- **AI slop:** reinvented `ui/` primitive (new select/modal/table/spinner), hardcoded design (`text-gray-`/`bg-white`/hex/`fontFamily`/`indigo`), `as any`/`@ts-ignore`, empty `catch`/leftover `console.log`, `key={index}`, missing loading/empty/error states, comment noise. (`references/anti-ai-slop.md`.)
- Dead code, unused exports, commented-out blocks, unused deps.

## Report format

Group findings by tier. Each finding: location, what, why, suggested fix. Be specific and short.

```
# Frontend audit — <scope>
Scanned: <files/folders, or "sampled: services/, components >800 lines, stores/">

## Tier 1 — correctness / state / data-layer (fix first)
- src/services/job-service.ts:1 — god-service, 3365 lines with business logic in fetch fns.
  Why: hides duplication, un-reviewable, huge agent context. Fix: split by sub-resource (data-layer D3), move logic to hooks/utils (D2).
- src/stores/interviewStore.ts:120 — server data cached in Zustand.
  Why: dual source of truth, sync bugs. Fix: move to a TanStack Query hook (state.md / D5).

## Tier 2 — duplication / structure / dead weight
- package.json — framer-motion AND motion both present; 31 files import framer-motion.
  Why: duplicate dep. Fix: migrate to motion/react, remove framer-motion (integrations.md).

## Tier 3 — polish / consistency / perf nits
- src/components/.../Chart.tsx:1 — recharts imported eagerly above a below-fold panel.
  Why: bundle bloat. Fix: next/dynamic, ssr:false.

## Summary
<counts per tier; top 3 highest-yield fixes; what to hand to /thh-fe-code>
```

End every audit by naming the **top 3 highest-yield fixes** and reminding the user to run **`/thh-fe-code`** to apply the confirmed ones. Do not change code in this mode.
