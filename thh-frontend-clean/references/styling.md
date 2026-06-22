# Styling — Tailwind CSS v4 + shadcn/ui + cva

Tailwind v4 is a ground-up rewrite. The mental model changed: **configuration is CSS, not JavaScript.**

## No `tailwind.config.js`
- Entry point is a single line: `@import "tailwindcss";` (not the old `@tailwind base/components/utilities`).
- **Design tokens live in CSS** under `@theme`, as CSS custom properties. The namespace prefix determines the utility:
  ```css
  @import "tailwindcss";
  @theme {
    --color-brand-500: oklch(0.62 0.19 256);  /* → bg-brand-500, text-brand-500 */
    --font-display: "Inter", sans-serif;       /* → font-display */
    --radius-card: 0.75rem;                     /* → rounded-card */
    --spacing: 0.25rem;                         /* base unit; mt-17 etc. work with no config */
  }
  ```
- Every `@theme` token is a real CSS variable, so it's usable in plain CSS and inline styles too — no duplication between Tailwind and CSS.
- Content detection is **automatic** (no `content` array). To scan classes inside an external package: `@source "../node_modules/@thh/ui";`.
- Migrate any leftover `tailwind.config.js` theme values into `@theme`. A `@config "tailwind.config.js"` bridge exists for plugins that need it, but the idiomatic target is CSS.

## Renamed defaults (v4) — fix when found
- Shadow/radius/blur scales were renamed so every utility has a named value: `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm`, `rounded-sm` → `rounded-xs`, `rounded` → `rounded-sm` (and similar for blur). If a migrated UI looks "heavier" than before, this is why.
- Gradients: `bg-gradient-to-r` → `bg-linear-to-r`.
- Opacity uses the slash syntax everywhere: `bg-black/50`, `text-current/70`.
- `size-4` sets width+height together (use instead of `w-4 h-4`).
- Container queries are built in: wrap with `@container`, then `@sm:`, `@lg:` variants (no plugin).

## Class composition: `cn()` + `cva`
- Merge/condition classes with **`cn()`** (clsx + tailwind-merge). Never build classes with template-literal concatenation — `cn()` resolves conflicts (`p-2` vs `p-4`) correctly. Canonical helper: `assets/lib/utils.ts`.
- Express component variants with **`class-variance-authority`** instead of conditional `className` soup:
  ```ts
  const button = cva("inline-flex items-center rounded-md font-medium", {
    variants: {
      variant: { default: "bg-brand-500 text-white", ghost: "hover:bg-muted" },
      size: { sm: "h-8 px-3 text-sm", md: "h-10 px-4" },
    },
    defaultVariants: { variant: "default", size: "md" },
  })
  // <button className={cn(button({ variant, size }), className)} />
  ```
- This collapses many conditional branches into one declarative table — fewer lines, no duplication.

## shadcn/ui & Radix
- You **own** the primitives in `components/ui`. Extend them (add a `cva` variant, accept more props) rather than forking or re-implementing.
- Compose with Radix `Slot` / the `asChild` prop to merge behavior onto arbitrary children instead of duplicating wrappers.
- Keep primitive components dumb and reusable; put feature logic in the feature component that uses them.

## Dark mode (next-themes)
Class-based strategy. Declare the dark variant once in CSS, then use `dark:` utilities:
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Drive it with `next-themes` (`<ThemeProvider attribute="class">`). Define light/dark token values with CSS variables under `:root` and `.dark` so utilities like `bg-background` flip automatically.

## Hygiene
- Don't reach for arbitrary values (`mt-[13px]`) when a token or scale step exists. Arbitrary values are an escape hatch, not the default.
- `@apply` in a **component-scoped** stylesheet (CSS Module) needs `@reference "../app/globals.css";` at the top of that file, or the theme utilities won't resolve. Prefer utilities in JSX over `@apply` anyway.
- Let `prettier-plugin-tailwindcss` sort classes automatically (see `assets/prettier.config.mjs`) — never argue about class order by hand.
- Custom utilities: `@utility tab-4 { tab-size: 4; }`. Custom variants: `@custom-variant`. Plugins: `@plugin "tailwindcss-animate";` (this repo uses `tw-animate-css`).
