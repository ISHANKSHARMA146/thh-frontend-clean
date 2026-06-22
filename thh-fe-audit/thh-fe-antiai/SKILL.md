---
name: thh-fe-antiai
description: >-
  ANTI-AI-SLOP mode for the THH frontend — enforces that code follows THH's
  own system design, design tokens, existing primitives, and established
  patterns (the "breadcrumbs") instead of generic LLM-default code. Catches and
  prevents AI slop: reinvented primitives (a new select when ui/select exists),
  hardcoded design values (text-gray/bg-white/hex/Inter/purple instead of the
  ink/paper/brand tokens + Fraunces serif), over-engineering, defensive try-catch
  bloat, redundant comments, `any`/type-casts, unstable keys, forwardRef, missing
  loading/empty/error states, weak a11y, and the generic-SaaS visual look.
  Works as a focused review (report) OR an enforce-while-writing constraint.
  Trigger on "/thh-fe-antiai", "is this AI slop", "make this match our design
  system", "follow our patterns / breadcrumbs", "this looks generic", "don't
  reinvent the component", "remove the slop". Pairs with /thh-fe-audit (full
  audit) and /thh-fe-code (apply fixes).
---

# THH Frontend — Anti-AI-Slop

Make every line look like a THH engineer wrote it, not like an LLM filled in a generic React app. **AI slop is plausible, polished code that ignores our system** — it reinvents primitives we already have, hardcodes design values instead of using our tokens, wraps trusted inputs in defensive try-catch, over-abstracts, and converges on the generic purple-gradient/Inter look. Slop has no obvious tells; that is why it must be hunted deliberately.

> **The one rule: follow the breadcrumbs.** Before writing anything, find the nearest existing example of the same thing in this repo and match it — its tokens, its primitive, its naming, its file shape. The codebase is the spec.

## The rulebook

The full catalog (THH design system, code-slop S1–S10, visual-slop list, the before-you-write checklist, detection greps) lives in **`references/anti-ai-slop.md`** next to the `/thh-fe-audit` skill. Load it:

```bash
find ~/.claude/skills .claude/skills -maxdepth 3 -path '*thh-fe-audit/references/anti-ai-slop.md' 2>/dev/null | head -1
```

Also read the area reference for whatever you're touching (`styling.md`, `components-structure.md`, `data-layer.md`, etc. — same `references/` dir).

## Two ways to run

### A) Review (report-only)
Scan the given file/diff for slop and report findings — **change nothing** in this sub-mode unless asked. Use the detection heuristics in §5 of the rulebook:
- hardcoded design: `text-gray-`, `bg-white`, `border-gray-`, hex colors, `fontFamily`, `indigo`/`purple` in className → must be `@theme` tokens (`text-ink`/`bg-paper`/`border-rule`/`text-brand`).
- type workarounds: `as any`, `: any`, `@ts-ignore`/`@ts-expect-error`.
- defensive bloat: empty `catch`, `console.log` left in, null-checking already-typed inputs.
- reinvented primitives: a new `*Select*`/`*Modal*`/`*Table*`/`*Spinner*`/`*Dropdown*` when one exists in `components/ui/`.
- React slop: `key={index}`, `forwardRef`, hand-written `useMemo`/`useCallback`/`memo`.
- missing states: a `useQuery`/list with no skeleton/empty/error branch.
- comment noise: comments restating the function name.

Report each as: `file:line — slop ID (S1–S10 / §) — what — the THH way`.

### B) Enforce-while-writing (the strong mode)
Bind every line you author this session to the breadcrumb checklist. **Before each Write/Edit**, self-verify the new code against the checklist (rulebook §4):
1. Found and opened the nearest existing example.
2. Reused the existing primitive (searched `components/ui/` + feature folder) — did not build a parallel one.
3. Tokens, not values (colors/spacing/radius/font from `@theme`).
4. Matched naming + file shape of the neighbors; named exports; colocated.
5. Minimum code — no abstraction before the rule of three; no defensive wrapping of trusted/typed inputs.
6. Loading/empty/error states + a11y (semantic elements, labels, `alt`).
7. Version-correct (React 19 / Next 15 / Tailwind v4 / Query v5 / Zustand v5).

If a block fails any check, rewrite it to match the breadcrumbs before finalizing. Then `pnpm typecheck` + `pnpm lint --fix`.

## THH anchors (memorize)
- **Editorial/paper, not generic-SaaS.** Tokens: `--color-ink`, `--color-paper`, `--color-rule`, `--color-brand` (+ `success/warn/danger` `-deep`/`-tint`). Display font = **Fraunces serif** via `--font-display`. Never `gray-*`/`white`/`indigo-*`/hex/Inter.
- **Primitives exist in `components/ui/`** — button, input, card, dialog, select, combobox, data-table, Pagination, StatusBadge, RoleBadge, **Breadcrumb**, SearchInput, LoadingSpinner, skeleton, sonner. Compose; don't reinvent. (The folder already has 7 selects / 3 tables / 3 spinners from past slop — pick the canonical one, never add an eighth.)
- **Breadcrumb nav** = `components/ui/Breadcrumb.tsx`; SEO breadcrumbs = `JsonLd.tsx`. Don't roll a new trail.

## Boundaries
- Review sub-mode reports; enforce sub-mode and "remove the slop" requests change code, then verify.
- Don't commit/push unless asked.
- For a full clean/fast/DRY audit beyond slop, use `/thh-fe-audit`; to apply a batch of confirmed fixes, use `/thh-fe-code`. All three share the same `references/`.
