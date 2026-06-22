# Performance

Fast responses come mostly from shipping less JavaScript and avoiding needless work, not micro-optimizations.

## Ship less client JS
- **Server Components by default** is the biggest lever — server-rendered code ships zero JS. Keep `"use client"` on small leaves (see `references/nextjs.md`).
- **Lazy-load heavy client-only libraries** with `next/dynamic` so they don't bloat the initial bundle:
  ```ts
  const Editor = dynamic(() => import('./editor'), { ssr: false, loading: () => <Skeleton /> })
  ```
  Apply to Tiptap/Lexical editors, Recharts charts, `@dnd-kit` boards, Calendly, and other below-the-fold or interaction-gated widgets.
- **Import narrowly.** `lucide-react` is tree-shakeable; `react-icons` can pull large sets — import from the specific icon path. With `date-fns`, import the functions you use (`import { format } from 'date-fns'`), never the whole namespace. Avoid pulling all of `lodash` — import per function or use native equivalents.
- Watch the bundle with `@next/bundle-analyzer` when adding deps.

## Avoid needless re-renders & refetches
- Correct **state placement** + **narrow Zustand selectors** (`useShallow`) eliminate most re-renders — more effective than memo hooks (see `references/state.md`).
- Raise TanStack Query **`staleTime`** to cut redundant network calls; use `placeholderData: keepPreviousData` for smooth pagination.
- If the React Compiler is on, skip manual memoization; if off, memoize only hot paths.

## Big lists & tables
- Use **TanStack Virtual** (already in the stack) to render only visible rows — essential for candidate/job tables and long pipelines.
- Pair **TanStack Table** with virtualization for data grids; paginate or virtualize, never render thousands of rows.

## Perceived speed
- **Stream** with `loading.tsx` / `<Suspense>` so the shell paints immediately and slow data fills in.
- **`useOptimistic`** for instant feedback on mutations.
- **`next/image`** (set `sizes`; `priority` on the LCP image) and **`next/font`** (no layout shift) — don't hand-roll image/font loading.
- **Debounce** filter/search inputs and reflect them to the URL; don't fire a request per keystroke.

## Realtime
- `socket.io-client`: create **one** shared client instance; subscribe in `useEffect` and **always clean up listeners** on unmount to avoid leaks and duplicate handlers. Reconcile incoming events into the TanStack Query cache (`setQueryData`/`invalidateQueries`) rather than into a parallel store.
