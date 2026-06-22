# State & Data

The single biggest source of duplication and bugs in this stack is putting data in the wrong place. Get this right and most problems disappear.

## Decision tree — where does this value live?

- **Came from the API / server?** → **TanStack Query**. It is the cache. Do not also store it in Zustand or `useState`.
- **Global client state shared across routes** (auth session, theme, feature tour, sidebar open, cross-page UI)? → **Zustand**.
- **Local to one component / subtree** (input value, hover, a toggle)? → `useState` / `useReducer`.
- **Should survive refresh, be shareable, or bookmarkable** (filters, search term, active tab, page number, sort)? → **URL search params** (`useSearchParams` + `router.replace`), not React state.

If two of these seem to apply, it is almost always server state. Default to TanStack Query.

---

## TanStack Query v5

### v5 API changes (older code/training gets these wrong)
- All hooks take a **single options object**: `useQuery({ queryKey, queryFn })`.
- `cacheTime` → **`gcTime`**.
- `keepPreviousData` → **`placeholderData: keepPreviousData`** (import the `keepPreviousData` identity function).
- `useErrorBoundary` → **`throwOnError`**.
- `isInitialLoading` → `isLoading`; status `'loading'` → `'pending'`; use `isPending` for "no data yet".
- `onSuccess`/`onError`/`onSettled` were **removed from `useQuery`** (still on `useMutation`). For side effects on query data, derive in render or use `useEffect`.

### Query keys: always from a factory
Ad-hoc string keys cause subtle cache/invalidation bugs. Treat keys as part of your API contract. One factory per feature:

```ts
// features/jobs/queries.ts
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
}
```

Invalidate by prefix: `queryClient.invalidateQueries({ queryKey: jobKeys.lists() })` refreshes every list, regardless of filters.

### Reusable query definitions with `queryOptions`
`queryOptions()` gives one typed, shareable definition usable by `useQuery`, `prefetchQuery`, `useSuspenseQuery`, and `setQueryData`:

```ts
export const jobDetailQuery = (id: string) =>
  queryOptions({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.get<Job>(`/jobs/${id}`),
    staleTime: 60_000,
  })

// component
const { data } = useQuery(jobDetailQuery(id))
// prefetch / RSC
await queryClient.prefetchQuery(jobDetailQuery(id))
```

### Custom hooks per feature
Components should call a feature hook, not `useQuery` directly. Keep one thin wrapper that injects auth/baseURL so feature hooks stay tiny:

```ts
export function useJob(id: string) {
  return useQuery(jobDetailQuery(id))
}
```

### Mutations: optimistic + rollback + invalidate
Standard shape — copy it:

```ts
export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateJobInput) => api.patch(`/jobs/${input.id}`, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: jobKeys.detail(input.id) })
      const prev = qc.getQueryData(jobKeys.detail(input.id))
      qc.setQueryData(jobKeys.detail(input.id), (old) => ({ ...old, ...input }))
      return { prev }
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(jobKeys.detail(input.id), ctx?.prev), // rollback
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: jobKeys.detail(input.id) }),
  })
}
```

### Defaults & tuning
- Set sensible global defaults once on the `QueryClient` (`staleTime`, `gcTime`, `retry`, `refetchOnWindowFocus`). Raising `staleTime` is the easiest way to cut redundant network calls.
- Pagination/infinite: `placeholderData: keepPreviousData` to avoid UI flashing between pages.
- Suspense: `useSuspenseQuery` + a `<Suspense>` boundary; pair with `throwOnError` and an error boundary for loading/error UI without manual `isLoading` checks.

### With Next.js
For non-interactive data, **fetch in a Server Component** and skip React Query entirely (less client JS). Use React Query for data that polls, updates in realtime, or is mutated/invalidated across many client components. To combine: `prefetchQuery` in the RSC, then wrap the client tree in `<HydrationBoundary state={dehydrate(qc)}>`.

---

## Zustand v5

### v5 API changes
- The selector **equality-function second argument was removed.** For multi-value selects use the **`useShallow`** hook from `zustand/react/shallow`. (If you truly need a custom equality fn, `createWithEqualityFn` lives in `zustand/traditional`.)
- The default export was removed — import named: `import { create } from 'zustand'`.

### Only export hooks / atomic selectors
Never let a component subscribe to the whole store — it will re-render on every change. Select the narrowest slice:

```ts
// good — atomic, re-renders only when `user` changes
const user = useAuthStore((s) => s.user)

// good — multiple values, shallow-compared
const { isOpen, toggle } = useUIStore(useShallow((s) => ({ isOpen: s.isOpen, toggle: s.toggle })))

// bad — subscribes to everything
const store = useAuthStore()
```

### Slices pattern (one bound store)
Split a large store into slices by domain; combine into one bound store. Actions live next to the state they change; cross-slice access via `get()`:

```ts
// stores/auth-slice.ts
export const createAuthSlice = (set, get) => ({
  user: null as User | null,
  login: (u: User) => set({ user: u }),
  logout: () => { set({ user: null }); get().resetDashboard() },
})

// stores/index.ts
export const useBoundStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({ ...createAuthSlice(...a), ...createUISlice(...a) }),
      { name: 'thh', partialize: (s) => ({ theme: s.theme }) }, // persist only what's needed
    ),
  ),
)
```

### Rules
- **Never create a store inside a component** — it re-creates on every render.
- Update **immutably**; `set` merges shallowly (spread nested objects yourself).
- Keep **server state out** of Zustand — that is TanStack Query's job.
- Persist deliberately with `partialize`; do not persist tokens or server caches.
- Derive computed values in selectors, not by storing duplicated derived state.

This repo already uses many slices (auth, user, job, candidate, interview, dashboard, credits, usage, reports, chatbot, tour, panelistDashboard, candidateDatabase). Add to the matching slice; do not spin up parallel stores for the same domain.
