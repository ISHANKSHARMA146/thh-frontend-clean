# Integrations — the libraries the repo actually leans on

The THH frontend depends on subsystems the core references don't cover. For each: where it lives, the one right pattern, and the trap. Read the relevant section when touching that area. The meta-rule across all of these:

> **One library per job.** If two packages do the same thing, that is a defect — pick one, migrate, delete the other. Audit `package.json` for competing deps.

## Known duplicate / dead deps in this repo (fix on sight)
- **`framer-motion` + `motion`** — `motion` is the renamed successor of `framer-motion` (same API, import from `motion/react`). Both are installed; ~31 files still import `framer-motion`. **Standardize on `motion/react`, migrate imports, remove `framer-motion`.** No API-level breaking changes.
- **Two rich-text editors: Tiptap + Lexical** — pick one for the product. New editors use the chosen one; don't add a third.
- **Multiple select/combobox libs: `react-select`, `cmdk`, Radix Select, `react-day-picker`** — converge on the shadcn/Radix primitive (`cmdk` for command palettes) and retire `react-select` for new work.

## Auth — `next-auth` v4
- Session via `next-auth` v4 (note: v4 API, not v5/Auth.js). Server: read session in Server Components / route handlers; never trust client-only session for authorization.
- The app token feeds `authenticatedFetch` (see `references/data-layer.md`). Don't re-implement token plumbing in components.
- Trap: v4 ≠ v5. Don't copy Auth.js v5 (`auth()` helper) snippets into v4 setup. `nodemailer` is wired for the email path — keep mail config server-side only.

## CMS — Sanity (`next-sanity`)
- Marketing/blog/content comes from Sanity. Queries (GROQ) and the client live under `src/sanity`. Render with `@portabletext/to-html` / portable-text components — don't `dangerouslySetInnerHTML` raw HTML.
- Images go through `@sanity/image-url` (`urlFor(...)`) for sizing/format — never hot-link the raw asset URL.
- Trap: keep the Sanity read token server-side. Fetch content in Server Components; pass down as props.

## Tables — TanStack Table v8 (+ Virtual)
- Big lists (candidate pipeline, jobs) use `@tanstack/react-table`. One column-def factory per table; keep `columns` stable (module-level or `useMemo`) so the table doesn't thrash.
- For long lists use `@tanstack/react-virtual` — render only visible rows. A plain `.map()` over thousands of candidates is a perf defect.
- Trap: don't store derived/sorted/filtered server rows in state — let Table's own state + the query cache own them (D5 in data-layer).

## Realtime — `socket.io-client`
- Interview/live features use one shared socket client instance — not a new connection per component.
- Connect/disconnect in an effect tied to the feature's lifecycle; clean up on unmount.
- Trap: socket events that update server entities should invalidate the relevant TanStack Query keys, not maintain a parallel state copy.

## Drag & drop — `dnd-kit`
- Kanban/pipeline reordering uses `@dnd-kit/core` + `sortable`. Keep the dragged-item id in local UI state; persist the new order via a mutation that invalidates the list query.
- Trap: optimistic reorder needs rollback in `onError` — don't leave the UI out of sync with the server on a failed move.

## Charts — `recharts`
- Dashboard charts use `recharts`. Import eagerly only if above the fold; otherwise `next/dynamic` (it's heavy).
- One reusable chart wrapper per chart type; don't re-derive axis/tooltip config inline per usage.

## Analytics — `posthog-js`
- One PostHog init (provider/client), event capture through a thin typed wrapper — not raw `posthog.capture('string')` scattered across components.
- Trap: never send PII (emails, names, tokens) as event properties. Gate capture on consent where required.

## UI utilities
- **Toasts: `sonner`** — one `<Toaster>` at the root, `toast(...)` everywhere. Don't add a second toast lib.
- **Drawers/sheets: `vaul`** (and Radix Dialog) — use the existing primitive; don't hand-roll a portal.
- **Theming: `next-themes`** — read theme via its hook; colors come from Tailwind `@theme` tokens (`references/styling.md`), not hardcoded hex.

## Heavy client-only libs → lazy load
Editors (Tiptap/Lexical), charts (recharts), dnd, and the Calendly embed (`react-calendly`) are large and client-only. Import via `next/dynamic` with `ssr: false` so they don't bloat the initial bundle or break SSR. (Cross-ref `references/performance.md`.)
