# Next.js 15 (App Router)

Treat the server as the primary rendering surface. Ship the minimum client JavaScript and control data freshness explicitly.

## Server vs Client Components
- Components are **Server Components by default**. They can fetch data, read secrets, and access the DB directly, and they ship **zero** JS to the browser.
- Add `"use client"` only where you need state, effects, event handlers, or browser APIs — and put it on the **smallest leaf**, pushed as deep as possible.
- Pattern: server component fetches data and renders mostly static markup, embedding small **client islands** for the interactive bits. Pass server data down as props.
- A client component cannot import a server component as a child by rendering it, but it **can** accept one via `children`/props (the "client wrapper, server children" pattern) — use this to keep providers/interactive shells thin.
- Never use `window`, `localStorage`, etc. in a file without `"use client"` — it will throw on the server.

## Async request APIs (Next 15 breaking change)
These are now **async** — always `await`:

```ts
// page.tsx — params & searchParams are Promises
export default async function Page({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params
  const sp = await searchParams
}
```

Same for `cookies()`, `headers()`, `draftMode()`: `const c = await cookies()`. The Next 15 codemod (`npx @next/codemod@latest next-async-request-api .`) migrates most call sites.

## Data fetching & caching (opt-in now)
Next 15 changed defaults from cached to **uncached**:
- `fetch` is **not cached by default**. Opt in per call: `fetch(url, { next: { revalidate: 3600 } })` (ISR) or `{ cache: 'force-cache' }` (static). `{ cache: 'no-store' }` forces dynamic.
- Route-segment config still works: `export const revalidate = 60`, `export const dynamic = 'force-dynamic' | 'force-static'`.
- **GET Route Handlers are not cached by default.** Add caching explicitly if needed.
- The **Client Router Cache** no longer caches page segments by default; opt back in with `experimental.staleTimes` if you want instant back/forward.
- The smallest `revalidate` among the fetches on a page governs the page.

Prefer fetching in Server Components over client-side fetching whenever the data is not interactive.

## Mutations: Server Actions
Use Server Actions instead of hand-rolled API routes + client fetch for form/data mutations:

```ts
'use server'
export async function updateJob(input: UpdateJobInput) {
  const parsed = updateJobSchema.parse(input) // validate — actions are public endpoints
  await requireAuth()                          // check auth — never trust the caller
  await db.job.update(parsed)
  revalidatePath('/jobs')                      // or revalidateTag('jobs')
}
```

- Call from a `<form action={updateJob}>` or from a client component inside `startTransition`.
- **Security:** treat every action as a public endpoint — validate input with the shared Zod schema and check authorization inside the action.
- Use `redirect()` for post-mutation navigation; `revalidatePath`/`revalidateTag` to refresh server data.

## Routing & file conventions
- Only `page`, `layout`, `route`, `loading`, `error`, `not-found`, `template`, and `default` are special. **Colocating** components, hooks, and tests inside a route folder is fine and encouraged — they are not routable.
- **Route groups** `(marketing)` organize without affecting the URL. **Parallel routes** `@slot` and **intercepting routes** `(.)` enable dashboards/modals.
- **Layouts** persist across navigation (no re-mount); **templates** re-mount. Use layouts for shells, templates only when you need fresh state per navigation.
- Streaming: add `loading.tsx` (or `<Suspense>`) so slow data streams in progressively.

## Built-ins (use them instead of custom)
- `next/image` for images (`sizes`, `priority` for LCP), `next/font` for fonts (no layout shift), `next/link` for navigation.
- Metadata via `export const metadata` or `generateMetadata` (don't manually inject `<head>` tags — though React 19 also lets you render `<title>`/`<meta>` in components).
- `middleware.ts` at the root for auth gating / rewrites; keep it light (Edge runtime, no Node APIs); scope with a `matcher`.

## Env vars
- `NEXT_PUBLIC_*` only for values safe to expose to the browser.
- All secrets: no prefix, read **only** in Server Components / Actions / route handlers, validated in one place (see `assets/env.ts`). Never import server env into a client component.
