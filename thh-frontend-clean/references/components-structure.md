# Structure, Composition & Writing Less Code

How the repo is organized so both humans and AI agents can find things instantly, plus the concrete techniques for fewer lines and zero duplication.

## File & folder structure
- **Feature-first.** Keep a feature's components, hooks, queries, schemas, and types together (e.g. `features/jobs/…` or colocated in the route folder). Proximity beats a global `components/` dumping ground for feature code.
- **Shared, reusable UI** → `components/ui` (shadcn primitives) and `components/` (shared composites).
- **One-way dependency graph:** `app/` → `components/` → `lib/`. **`lib/` (server actions, queries, schemas, utils) imports nothing from `components/` or `app/`.** This keeps the server/client boundary clean and prevents circular deps.
- **`hooks/` and `stores/` are client-only** — anything importing them implicitly needs `"use client"`. Keeping them separate makes the boundary visible in the file tree.
- **Shared types** in `types/` (or colocated). Derive from Zod with `z.infer` rather than duplicating.
- This is the kind of structure agents navigate well: predictable locations mean the model finds files by glob/search without needing a map, and stale "architecture docs" can't mislead it.

## Naming
- Components `PascalCase`; hooks `useThing`; utilities `camelCase`; constants `UPPER_SNAKE_CASE`.
- File naming: follow the neighbors. shadcn `ui/` uses `kebab-case.tsx`; component files elsewhere commonly use `PascalCase.tsx`. Pick the local convention and stay consistent — don't mix within a folder.
- **Named exports only**, except Next's required default `page`/`layout`/`route`/`error`/`loading` exports. Named exports make symbols greppable and refactors safe.

## Composition over duplication
- **`cva` for variants** instead of branching `className` strings (see `references/styling.md`).
- **Radix `Slot` / `asChild`** to attach behavior to arbitrary children instead of wrapper duplication.
- **`children` and slot props** to make one layout component serve many pages.
- **Compound components** for repeated structures (e.g. `<Card>`, `<Card.Header>`, `<Card.Body>`) when several pieces always travel together.
- **Server components for the static shell, small client islands for interaction** — don't make a whole page a client component to get one button working.

## Techniques for fewer lines (DRY, applied to this stack)
- One **Zod schema** → type via `z.infer`, reused on client and server. (Don't write a parallel TS interface.)
- One **query-key factory** per feature; one **`queryOptions`** definition reused by query/prefetch/suspense.
- One **`cn()`** for all class merging; never template-literal class concatenation.
- **Server Actions** instead of `route.ts` + client `fetch` + manual loading/error state — often removes dozens of lines per mutation.
- React 19 **form hooks** (`useActionState`/`useFormStatus`/`useOptimistic`) and the **compiler** remove manual state and memo boilerplate.
- **Generic reusable hooks** for repeated client patterns (a `useDisclosure`, a typed API wrapper) — but only after the rule of three.
- Lean on **framework/library primitives** (`next/link`, `next/image`, `next/font`, shadcn, TanStack Table) instead of bespoke versions.

## Don'ts
- **Don't pre-abstract.** Two similar blocks can wait; abstract on the third real occurrence. Premature abstraction creates worse coupling than a little duplication.
- **Don't create deep barrel `index.ts` files** that re-export everything — they hurt tree-shaking, invite circular imports, and slow type-checking. Prefer direct imports; use a barrel only for a small, stable public surface (like `components/ui`).
- **Don't leave dead code, commented-out blocks, or unused exports/deps** — delete them. They mislead both readers and agents.
- **Don't duplicate server data into client state** (see `references/state.md`).
- **Don't write large prose docs** to explain the code — consistent code plus this skill is the documentation.
