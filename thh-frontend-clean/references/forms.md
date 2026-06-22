# Forms — react-hook-form + Zod

One schema is the source of truth for validation **and** types **and** server-side checks. This is the biggest dedup win in form code.

## The pattern
```ts
// schema.ts — ONE source of truth
export const jobSchema = z.object({
  title: z.string().min(1, "Required"),
  location: z.string().min(1),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
})
export type JobInput = z.infer<typeof jobSchema>   // never hand-write this type
```

```tsx
// form.tsx
const form = useForm<JobInput>({
  resolver: zodResolver(jobSchema),
  defaultValues: { title: "", location: "" },   // always provide defaults
  mode: "onTouched",                              // validate after first blur — better UX
})

function onSubmit(values: JobInput) { mutate(values) }
```

## Rules
- **Always pass `defaultValues`** (prevents uncontrolled→controlled warnings and makes `reset()` reliable).
- Use `register` for native inputs (uncontrolled = fast, fewer re-renders). Use **`Controller`** only for controlled components that don't expose a ref/`onChange` the RHF way — shadcn `Select`, `react-select`, `react-phone-number-input`, date pickers, OTP inputs.
- Prefer the **shadcn `Form` primitives** (`Form`, `FormField`, `FormItem`, `FormControl`, `FormMessage`) — they wire labels, error messages, and aria attributes for you. Don't hand-roll error display.
- `reset()` after a successful mutation; surface server errors with `setError`.
- Coerce at the schema boundary (`z.coerce.number()`, `z.coerce.date()`) so inputs that yield strings validate cleanly.

## Reuse the schema on the server
Validate the **same** Zod schema inside the Server Action / API handler. The client schema is for UX; the server schema is the real gate — and it's the *same object*, so there's zero duplication:
```ts
'use server'
export async function createJob(input: unknown) {
  const data = jobSchema.parse(input)   // throws on bad input
  // ...
}
```

## With React 19 Actions
For native-form flows you can pass a Server Action to `<form action={...}>` and use `useActionState` for pending/result, validating with the same schema server-side and mapping field errors back. For rich client forms, stay with react-hook-form. Pick one per form; don't mix both controllers on the same fields.

## Specifics in this repo
- Password strength: `zxcvbn` (show a meter; don't block on it server-side).
- Phone: `react-phone-number-input` + `libphonenumber-js` (store E.164; validate with the lib).
- Keep field-level components small and reuse them across forms instead of repeating `FormField` boilerplate.
