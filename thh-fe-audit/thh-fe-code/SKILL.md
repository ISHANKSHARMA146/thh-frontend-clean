---
name: thh-fe-code
description: >-
  APPLY mode for the THH frontend — the change-making counterpart of
  /thh-fe-audit. Loads the same rulebook (the references/ next to /thh-fe-audit)
  and uses it to (a) APPLY confirmed findings from a prior audit, or (b) write
  new frontend code clean-by-construction for the THH stack (Next 15, React 19,
  TS, Tailwind v4, TanStack Query 5, Zustand 5, RHF+Zod, shadcn/Radix, services
  layer, next-auth, Sanity, TanStack Table/Virtual, socket.io, dnd-kit,
  recharts, posthog). Edits, splits, refactors, and verifies with typecheck +
  lint. Trigger on "/thh-fe-code", "apply the audit fixes", "fix the confirmed
  findings", "split this god-file", "build this component cleanly", "refactor
  this the THH way". For a read-only report that changes nothing, use
  /thh-fe-audit instead.
---

# THH Frontend — Code (apply changes)

The change-making half of the pair. `/thh-fe-audit` finds and reports; **`/thh-fe-code` applies.** Two entry paths:

- **Apply audit findings** — the user ran `/thh-fe-audit`, confirmed which findings to fix; you implement exactly those.
- **Clean-by-construction** — you're writing or refactoring frontend code and every line must satisfy the rulebook as it's written (prevention, not cure).

## The rulebook (same one the audit uses)

The authoritative rules are the `references/` directory and `assets/` configs that sit **next to this skill's parent** — i.e. the `/thh-fe-audit` skill folder. This skill is installed as a sibling (or nested) of it. Load the references on demand:

```bash
# locate the shared references regardless of install layout
find ~/.claude/skills .claude/skills -maxdepth 3 -path '*thh-fe-audit/references/data-layer.md' 2>/dev/null | head -1
```

Then read the relevant file(s) for the area you're touching:

| Area | Reference |
|---|---|
| Services, fetching, caching, query keys, prefetch | `references/data-layer.md` |
| Global/client state, re-renders, Zustand slices | `references/state.md` |
| Pages, routing, Server Components/Actions, caching | `references/nextjs.md` |
| Components, hooks, React 19 hooks, memoization | `references/react.md` |
| Styling, Tailwind `@theme`, variants, dark mode | `references/styling.md` |
| Forms, validation, schemas | `references/forms.md` |
| Structure, composition, god-file splitting | `references/components-structure.md` |
| Bundle size, lazy loading, tables, perceived speed | `references/performance.md` |
| next-auth, Sanity, Table/Virtual, socket, dnd, recharts, posthog, dup libs | `references/integrations.md` |
| AI slop, design tokens, reinvented primitives, following our patterns | `references/anti-ai-slop.md` |
| ESLint, Prettier, TS, env, pre-commit | `references/tooling.md` |

If you can't locate `references/`, you still apply the **Golden rules** and **version cheat sheet** from memory (below) — but read the reference when one exists for the area.

## Workflow — applying audit findings

1. **Take the confirmed list.** Work only the findings the user approved. Don't expand scope to unrelated code — that's a fresh audit's job.
2. **Order by tier.** Tier 1 (correctness/state/data-layer) before Tier 2 (duplication/structure) before Tier 3 (polish).
3. **Read the reference** for each finding's area before editing.
4. **Smallest correct change.** A 3k-line service is split incrementally by sub-resource; never rewritten in one pass. Each edit keeps behavior identical.
5. **Self-verify before each Write/Edit** against the rule the finding cites and the Golden rules — don't introduce a new violation while fixing another.
6. **Verify after.** Run `pnpm typecheck` and `pnpm lint --fix`. Not done until both pass. Report what changed (files + the finding IDs addressed).

## Workflow — clean-by-construction

1. **Match the codebase first.** Before writing, open the nearest existing example (sibling hook, store slice, form, service, component) and copy its shape. Consistency beats novelty.
2. **Hold the Golden rules** for everything you author this session.
3. **Self-verify before each Write/Edit.** Re-check the new code against the rules — single source of truth, right state location, no god-file, no duplicate lib, server-first, version traps. Fix before finalizing.
4. Enforce only on what **you** author; don't rewrite unrelated working code (use `/thh-fe-audit` to find that, then apply deliberately).
5. **Verify:** `pnpm typecheck` + `pnpm lint --fix` green before done.

## Golden rules (bind every line)

1. **State in exactly one place.** Server data → TanStack Query (never copied into Zustand/`useState`). Global client/UI → Zustand. Local → `useState`. Shareable view state → URL params.
2. **Server-first.** Server Components by default; `"use client"` on the smallest leaf, pushed down.
3. **One source of truth per concept.** One Zod schema (`z.infer`), one query-key factory/feature, one `cn()`, one fetch wrapper + base URL, one shadcn primitive per element.
4. **Compose, don't repeat.** `cva`, `Slot`/`asChild`, `children`, small components. Rule of three.
5. **One library per job.** Don't add a competing dep; prefer the existing primitive. (`framer-motion`→use `motion/react`.)
6. **No god-files.** Component >~300 lines, service >~400, store >~300, hook >~150 → split as you go.
7. **Services are transport-only.** Build URL → `authenticatedFetch` → parse → typed return. Business logic lives in hooks/utils, not services. (`references/data-layer.md`.)
8. **Let the compiler work.** React Compiler on → no manual `useMemo`/`useCallback`/`memo`. Type everything; no `any`. Named exports (except Next defaults).
9. **Follow the breadcrumbs — no AI slop.** Match the nearest existing example, use THH design tokens (`text-ink`/`bg-paper`/`border-rule`/`text-brand`, Fraunces serif) not hardcoded values, reuse `components/ui/` primitives (don't reinvent a select/modal/table/spinner), no defensive try-catch around trusted/typed inputs, no redundant comments, handle loading/empty/error + a11y. (`references/anti-ai-slop.md`.)

## Version cheat sheet (the traps)

- **Next 15** — `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` are async — `await`. `fetch`/GET handlers uncached by default. Mutations = Server Actions + `revalidatePath`/`revalidateTag`.
- **React 19** — `ref` is a prop, no `forwardRef`. `useActionState`/`useFormStatus`/`useOptimistic`; `use()` for promises/context.
- **Tailwind v4** — no `tailwind.config.js`; tokens in CSS `@theme`; `@import "tailwindcss"`; `cn()` + `cva`; renamed shadow/radius scale.
- **TanStack Query v5** — single options object; factory keys; `gcTime`/`placeholderData: keepPreviousData`/`throwOnError`; set `staleTime` for prefetched data.
- **Zustand v5** — `useShallow` for multi-value selectors; export hooks, not the raw store.

## Boundaries

- This mode **changes code**. The read-only counterpart is `/thh-fe-audit`.
- Don't commit or push unless asked.
- If context is summarized and you're unsure the rules are loaded, re-locate and re-read `references/` for the area you're in, then continue — don't drift to unconstrained code.
