# Data Layer — services, fetching, caching

The THH repo's dominant data pattern is a thick `src/services/*-service.ts` layer (raw `fetch` via `authenticatedFetch`) feeding TanStack Query hooks. This file is the rulebook for that layer — it is the single highest-yield area to clean, because the largest files in the repo live here (`job-service.ts` ~3.4k lines, `interview-service.ts` ~2.7k, `candidate-service.ts` ~2.3k).

Read this whenever touching anything under `services/`, any `useQuery`/`useMutation`, `authenticatedFetch`, or API base-URL handling.

## The target shape

Three thin layers, each with one job. Nothing else belongs in them.

```
component  →  feature hook (useQuery/useMutation)  →  service fn (fetch only)  →  BE
   UI           cache + keys + invalidation            transport + types
```

1. **Service fn = transport only.** Build the URL, call `authenticatedFetch`, parse JSON, throw a typed error, return typed data. **No business logic, no derived/computed values, no formatting, no React, no caching.** If a service function has `if`-branches that shape business outcomes, that logic belongs in the hook or a pure util — not the service.
2. **Feature hook = cache policy.** `useQuery`/`useMutation`, the query-key factory, `staleTime`/`gcTime`, `invalidateQueries`. Components call the hook, never `useQuery` directly and never a service fn directly.
3. **Component = render + call hook.** No `fetch`, no key strings, no `API_BASE_URL`.

## Rules (audit these)

### D1 — One shared fetch wrapper, one base URL
`authenticatedFetch` + the `API_BASE_URL` resolution must be defined **once** (in `utils/api`) and imported everywhere. Flag any file that re-declares `const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL...` or hand-rolls auth headers. There is exactly one transport entry point.

### D2 — Services hold no business logic
A service fn maps 1:1 to a BE endpoint and does only: URL build → fetch → parse → typed return. Move branching, status interpretation, mapping, sorting, and formatting out into hooks or `utils/`. (The structured-error class like `ApplyApiError` that carries `status` so callers can branch **is** allowed — it is transport metadata, not business logic.)

### D3 — Split god-services
A single `*-service.ts` over ~400 lines is a defect. Split by sub-resource into a folder:
```
services/job/
  index.ts        // re-exports the public surface only (small, stable)
  list.ts  detail.ts  create.ts  applicants.ts  collaborators.ts
  types.ts        // shared Job/JobStatus types
```
Keep each file one cohesive resource. Do **not** create a deep barrel that re-exports everything internal — `index.ts` exposes only what components/hooks consume.

### D4 — Types live once, derived where possible
A service's response types live in `services/<feature>/types.ts` (or are `z.infer` of the request schema). Never hand-write a second interface that mirrors a Zod schema or another service's type. Import the type; don't copy it.

### D5 — No server data in client state
Anything that came from the API is owned by TanStack Query. Never copy it into Zustand or `useState`. (Cross-ref `references/state.md`.) Derived view state (filters, selected row, tab) is allowed in URL params / Zustand — the *source* data is not.

### D6 — Query keys from a factory
One key factory per feature. No ad-hoc string keys at call sites. Invalidate by factory key after mutations.

```ts
export const jobKeys = {
  all: ['jobs'] as const,
  list: (filters: JobFilters) => [...jobKeys.all, 'list', filters] as const,
  detail: (id: number) => [...jobKeys.all, 'detail', id] as const,
}
```

### D7 — Set staleTime deliberately
TanStack Query default `staleTime` is `0`, so a hydrated/prefetched query refetches immediately on mount. For server-prefetched or rarely-changing data, set `staleTime` (e.g. 60s) so the client renders the cache and skips the redundant refetch. Audit `useQuery` calls that prefetch on the server but leave `staleTime` at the default.

### D8 — Prefetch + HydrationBoundary for first paint
For App-Router pages, prefetch in the Server Component with a per-request `QueryClient`, `dehydrate`, and wrap the client subtree in `HydrationBoundary`. Avoids the mount-time spinner + double fetch. Don't fetch-on-mount in a client component when the page is server-rendered.

```tsx
// page.tsx (Server Component)
const qc = makeQueryClient()
await qc.prefetchQuery(jobDetailQuery(id))   // staleTime set inside
return (
  <HydrationBoundary state={dehydrate(qc)}>
    <JobDetail id={id} />
  </HydrationBoundary>
)
```

### D9 — Mutations invalidate, don't hand-patch cache (unless optimistic)
After a mutation, `invalidateQueries({ queryKey: jobKeys.detail(id) })`. Use `setQueryData` only for deliberate optimistic updates with rollback in `onError`. No manual local copies of the mutated entity.

## Migration order when cleaning a service
1. Extract the shared `authenticatedFetch`/base-URL if duplicated (D1).
2. Pull business logic out of service fns into hooks/utils (D2).
3. Split the file by sub-resource once it's transport-only (D3).
4. Add/consolidate the key factory + `staleTime` (D6, D7).
5. Wire prefetch + HydrationBoundary on the owning page (D8).

Make the smallest change that fixes the issue. A 3k-line service is split incrementally by resource, not rewritten in one pass.
