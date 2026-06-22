# Anti-AI-Slop — follow the breadcrumbs, don't generate generic

The job is to write code that looks like **a THH engineer wrote it on a good day** — not code an LLM would emit for a generic React app. AI slop is *plausible, polished, and wrong for this repo*: it works, it's typed, it has comments — but it ignores our design system, reinvents primitives we already have, and adds defensive bloat nobody asked for. Slop has no obvious tells; that's what makes it dangerous in review.

This file is the rulebook for the **`/thh-fe-antiai`** mode and a golden constraint for **`/thh-fe-code`**. Audit against it in **`/thh-fe-audit`**.

> **The one rule: follow the breadcrumbs.** Before writing anything, find the nearest existing example of the same thing in this repo and match it — its tokens, its primitive, its naming, its file shape. The codebase *is* the spec. Generic "good code" that doesn't fit the system is slop.

---

## 1. The THH design system (the breadcrumbs you must follow)

This product is **editorial / paper**, not generic-SaaS. The tokens live in `src/app/globals.css` under `@theme`. Use them — never hardcode.

- **Colors (tokens, not hex):** `--color-ink` (#0F172A text), `--color-ink-muted`, `--color-ink-subtle`, `--color-paper` (#FAFAF7 bg), `--color-paper-deep`, `--color-rule` / `--color-rule-strong` (borders), `--color-brand` (#2B7BD3), `--color-brand-deep`, `--color-brand-tint`, plus `success/warn/danger` `-deep`/`-tint` pairs. Use `text-ink`, `bg-paper`, `border-rule`, `text-brand` — **never** `text-gray-900`, `bg-white`, `#0F172A`, or (worst) an indigo/purple default.
- **Type:** display font is **Fraunces serif** via `--font-display`. We are not an Inter/Roboto app. Headings use the display font; don't override font-family inline.
- **Primitives exist — use them:** `src/components/ui/` already has `button`, `input`, `card`, `dialog`, `select`, `combobox`, `data-table`, `Pagination`, `StatusBadge`, `RoleBadge`, `Breadcrumb`, `SearchInput`, `LoadingSpinner`, `skeleton`, `sonner` (toasts), and more. Compose these. Do **not** hand-roll a new button/modal/select/table/spinner/badge.
- **Breadcrumbs (literal):** navigation breadcrumbs use the existing `src/components/ui/Breadcrumb.tsx`; SEO breadcrumb structured data uses `JsonLd.tsx`. Don't build a new trail component.

### Cautionary tale (real slop already in this repo — don't add to it)
`src/components/ui/` already contains the scars of convention-blind generation: **seven** overlapping select/dropdown things (`select.tsx`, `combobox.tsx`, `custom-select.tsx`, `CustomSelect.tsx`, `CustomSelectInner.tsx`, `CustomDropdown.tsx`, `MultiSelect.tsx`), **three** tables (`data-table.tsx`, `DataTable.tsx`, `VirtualTable.tsx`), **three** spinners (`LoadingSpinner.tsx`, `loading-spinner-ring.tsx`, `LoadingOverlay.tsx`), two search inputs, and **mixed kebab/Pascal naming in one folder**. Every one of these is "AI built a new abstraction instead of finding the existing one." The anti-slop mandate: **pick the canonical one, reuse it, and stop the bleeding** — never add an eighth select.

---

## 2. Code slop catalog (bad → the THH way)

Each is a finding. Examples are illustrative, not exhaustive.

### S1 — Convention-blind: reinvents an existing primitive
The single most common slop. AI emits generic-correct code instead of the repo's code.
```tsx
// ✗ SLOP — hand-rolled select
<div className="relative">
  <button onClick={() => setOpen(!open)} className="border rounded px-3 py-2">…</button>
  {open && <ul className="absolute bg-white shadow">…</ul>}
</div>
```
```tsx
// ✓ THH — use the existing primitive
import { Select } from "@/components/ui/select"
<Select options={options} value={value} onChange={setValue} />
```
Rule: **search `components/ui/` and the nearest feature folder before building any UI element.**

### S2 — Over-engineering / needless abstraction
A factory, a generic, a provider, a config object — for one call site.
```ts
// ✗ SLOP — abstraction layer for one use
function createApiHandler<T>(cfg: HandlerConfig<T>) { /* 60 lines */ }
const getJob = createApiHandler({ path: "/job", method: "GET", parse: ... })
```
```ts
// ✓ THH — just write the 5 lines (rule of three before abstracting)
export const getJob = (id: number) =>
  authenticatedFetch<Job>(`/job/${id}`)
```

### S3 — Defensive programming bloat
Try-catch soup, silent error swallowing, null checks on already-trusted inputs, console spam.
```tsx
// ✗ SLOP
try {
  const data = await getJob(id)
  if (data && data.id && Array.isArray(data.applicants)) {
    try { setJob(data) } catch (e) { console.log("setJob failed", e) }
  }
} catch (e) { console.error(e); /* swallow */ }
```
```tsx
// ✓ THH — let TanStack Query own loading/error; type guarantees shape
const { data: job } = useJob(id)   // error surfaced by the query boundary
```
Rule: errors flow to the query error boundary / typed `*ApiError`. No empty catches, no `console.log` left in, no validating types the type system already guarantees.

### S4 — Redundant comments / docstring noise
```ts
// ✗ SLOP
// This function gets the user by id
// It takes an id and returns a user
export const getUser = (id: number) => authenticatedFetch<User>(`/user/${id}`)
```
```ts
// ✓ THH — name says it; comment only the non-obvious (a BE quirk, a workaround)
export const getUser = (id: number) => authenticatedFetch<User>(`/user/${id}`)
```
Comment *why*, never *what*. Match the repo's comment density (sparse).

### S5 — Type workarounds
```ts
const rows = (data as any).items.map((x: any) => x as Row)   // ✗ SLOP
```
```ts
const { items } = data        // ✓ data typed via z.infer / service return type
```
`any` and rescue-casts are defects. Fix the type, don't bypass it. (Cross-ref state/data-layer refs.)

### S6 — Duplication instead of composition
Copy-pasted markup/handlers with one value changed. Studies show AI multiplies duplicated blocks 4–8×.
→ Extract a component / `cva` variant / shared hook on the third occurrence. (`references/components-structure.md`.)

### S7 — Hardcoded design values
```tsx
<div className="bg-white text-gray-900 border-gray-200 rounded-2xl">   // ✗ SLOP
<h1 style={{ fontFamily: "Inter" }}>                                   // ✗ SLOP
```
```tsx
<div className="bg-paper text-ink border-rule rounded-lg">             // ✓ THH tokens
```
No raw hex, no `gray-*`/`white`/`indigo-*`, no inline font-family. Tokens only.

### S8 — React correctness slop
- Unstable keys: `key={index}` on dynamic lists → use a stable id.
- Manual `useMemo`/`useCallback`/`memo` when the React Compiler is on → remove.
- `forwardRef` (React 19) → `ref` is a prop.
- Eager import of heavy client libs (editors/charts/dnd) → `next/dynamic`.

### S9 — Missing real-world states
AI ships the happy path. THH components handle **loading (skeleton), empty, and error** states using the existing `skeleton`, empty-state pattern, and toast/error boundary. A list with no empty state is a finding.

### S10 — Accessibility skipped
Clickable `<div>` instead of `<button>`, no label on icon buttons, no focus ring, images without `alt`. Use the semantic element / Radix primitive (handles a11y) and the `OptimizedImage`/`alt` convention.

---

## 3. Visual slop catalog (the generic-AI look — avoid)

LLMs converge on a median aesthetic. None of it is THH (we're editorial/paper/serif). Flag and avoid:
- Inter/Roboto everywhere; **purple/indigo gradients** on white.
- Centered hero with a badge pill + 3-equal-card grid, for everything.
- Excessive `rounded-2xl`/`rounded-full` on every box; glassmorphism (`backdrop-blur` + translucent); dark glows / neon shadows; floating icon-in-pill rows.
- Fake dashboard mockups, decorative gradients with no information.
- Emoji as UI icons (use `lucide-react`).
Match the existing pages' restraint: paper background, ink text, serif headings, hairline `--color-rule` borders, brand-blue accents used sparingly.

---

## 4. Before-you-write breadcrumb checklist (run every time)

1. **Find the nearest example** — same component type, same data pattern, same feature folder. Open it.
2. **Reuse the primitive** — is there already a `ui/` component (or feature component) for this? Use it; don't build a parallel one.
3. **Tokens, not values** — colors/spacing/radius/font from `@theme`.
4. **Match naming + file shape** — follow the neighbors (Pascal vs kebab per folder), named exports, colocated.
5. **Minimum code** — would a senior write fewer lines? No abstraction before the rule of three. No defensive wrapping of trusted/typed inputs.
6. **States + a11y** — loading/empty/error handled; semantic elements; `alt`/labels.
7. **Version-correct** — React 19 / Next 15 / Tailwind v4 / Query v5 / Zustand v5 idioms (see SKILL cheat sheet).

If a generated block fails any of these, it's slop — rewrite it to match the breadcrumbs before finalizing.

---

## 5. Detection heuristics (for audit mode)

Grep/scan signals that something is slop:
- `text-gray-`, `bg-white`, `border-gray-`, `#[0-9a-fA-F]{3,6}`, `fontFamily`, `indigo`/`purple`/`violet` in className → hardcoded design / generic palette (S7, §3).
- `as any`, `: any`, `@ts-ignore`, `@ts-expect-error` → type workarounds (S5).
- `catch (e) {}`, `catch (e) { console.` , `console.log(` left in source → defensive bloat (S3).
- `key={i}` / `key={index}` on a `.map` → unstable keys (S8).
- New `*Select*`, `*Dropdown*`, `*Modal*`, `*Table*`, `*Spinner*` files when a `ui/` primitive exists → reinvented primitive (S1, §1).
- Comments restating the function name; multi-line "what it does" doc blocks on trivial fns → comment noise (S4).
- `forwardRef`, hand-written `useMemo`/`useCallback`/`memo` → React-19/compiler slop (S8).
- Components with a `useQuery`/list but no skeleton/empty/error branch → missing states (S9).

Report these like any other finding, tier them, and cite the rule ID (S1–S10 / §-number).
