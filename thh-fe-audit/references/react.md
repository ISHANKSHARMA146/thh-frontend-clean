# React 19

React 19 removes a lot of boilerplate. Use the new primitives instead of the old patterns; ensure `@types/react` and `@types/react-dom` are on v19 for correct inference.

## `ref` is a normal prop — no `forwardRef`
```tsx
// React 19
function TextInput({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />
}
```
Delete `forwardRef` wrappers when you touch them. (shadcn primitives generated for React 19 already do this; older generated ones may still use `forwardRef` — leave working code alone unless you're editing it.)

## The React Compiler
If the compiler is enabled (`babel-plugin-react-compiler`), it auto-memoizes. **Do not hand-write `useMemo`, `useCallback`, or `React.memo`** — they add noise and can fight the compiler. Write plain, readable components.
- If the compiler is **not** enabled, still memoize genuinely hot paths and stable callbacks passed to memoized children — but don't memoize everything reflexively.
- Either way, the fix for re-renders is usually correct state placement and narrow selectors (see `references/state.md`), not scattering memo hooks.

## Actions & form hooks (replace manual form state)
- **`useActionState`** (not the old `useFormState`) handles pending/error/result for an action:
  ```tsx
  const [state, submitAction, isPending] = useActionState(action, initialState)
  ```
- **`useFormStatus`** reads the parent `<form>`'s pending state from a child (e.g. a submit button) without prop-drilling.
- **`useOptimistic`** shows instant feedback while a mutation is in flight and auto-reverts on error:
  ```tsx
  const [optimistic, addOptimistic] = useOptimistic(items, (cur, next) => [...cur, next])
  ```
- Async functions in transitions get automatic pending/error handling:
  ```tsx
  startTransition(async () => { await save() })
  ```

Use these for native-form / Server Action flows. For complex client forms, keep using react-hook-form + Zod (see `references/forms.md`) — the two coexist.

## `use()` for promises and context
- Read a promise during render (Suspense-integrated): `const data = use(promise)`. Don't create the promise inside the component; pass it in or get it from a cache/framework.
- Read context conditionally: `use()` can be called inside conditions and loops, unlike `useContext`.

## Other changes worth knowing
- Render document metadata in components: `<title>`, `<meta>`, `<link>` hoist to `<head>` automatically.
- Context provider shorthand: `<ThemeContext value={...}>` (no `.Provider` needed).
- Cleanup functions from `ref` callbacks are supported.
- **Removed:** `propTypes` and `defaultProps` on function components (use default parameters), legacy string refs, legacy context API. Replace these when found.

## General component rules
- Keep components small and focused; split when a component grows past one clear responsibility.
- Derive state during render instead of duplicating it in `useState` + `useEffect` (a `useEffect` that only syncs derived state is usually a smell).
- Keys on lists must be stable IDs, never array index for dynamic lists.
- Co-locate a component's hook and types with the component (see `references/components-structure.md`).
