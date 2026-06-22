# Tooling — the deterministic layer

This is where most "code quality" should be enforced. Linters, formatters, and the type checker are faster, deterministic, and don't consume an agent's context window — so rules that can live here should **never** be written as prose. Ready-to-copy configs are in `assets/`.

## TypeScript (strict)
- `"strict": true` in `tsconfig.json` is non-negotiable — it catches at compile time what would otherwise be runtime bugs an agent wastes turns debugging.
- Keep the `@/*` path alias. Add a script: `"typecheck": "tsc --noEmit"`.
- Strict types are self-documenting and let agents refactor safely — the single highest-ROI AI-friendliness setting.

## ESLint 9 (flat config)
- Use `assets/eslint.config.mjs`: extends `next/core-web-vitals` + `next/typescript`, with rules that **encode the conventions so violations auto-flag** — ban `any`, enforce `react-hooks/exhaustive-deps`, flag unused vars/imports, and restrict default exports (allowed only under `app/**` for Next's required exports).
- Run in CI and locally: `"lint": "next lint"` (or `eslint .`).

## Prettier + Tailwind class sorting
- `assets/prettier.config.mjs` enables **`prettier-plugin-tailwindcss`**, which auto-sorts Tailwind classes (v4-aware). This makes class order consistent for free — neither humans nor agents ever think about it.
- Format on save / pre-commit. Don't put formatting rules in any doc.

## Pre-commit (husky + lint-staged)
- `assets/SETUP.md` wires husky + lint-staged to run `eslint --fix` and `prettier --write` on staged files, and `tsc --noEmit` before commit. Generated code gets fixed before it lands, keeping the codebase consistent enough that agents learn patterns by example.
- Alternative in Claude Code: a Stop hook that runs the formatter/linter and feeds errors back for the agent to fix.

## Type-safe environment variables
- `assets/env.ts` validates env at boot with Zod (via `@t3-oss/env-nextjs`), separating server-only from `NEXT_PUBLIC_*`. This kills a whole class of "undefined in prod" bugs an agent can't foresee, and documents required vars in code.

## One instruction file, not many
- Keep a single, **lean** repo-root `AGENTS.md` (`assets/AGENTS.md.template`) and symlink `CLAUDE.md` to it (`ln -s AGENTS.md CLAUDE.md`) so every tool reads one source. Don't maintain duplicate `.cursorrules` / `copilot-instructions.md` with the same content.
- If rules ever need to be larger, prefer scoped `.cursor/rules/*.mdc` with `globs` (load only when matching files are touched) over one growing monolith.

## Optional: Biome
If the team wants a single fast tool instead of ESLint + Prettier, Biome (Rust) covers lint + format in one. Trade-off: a smaller plugin ecosystem than ESLint. Either is fine; don't run both linters at once.

## Definition of done
A change is complete only when `pnpm typecheck` and `pnpm lint` pass and relevant Vitest tests are green. Don't claim completion otherwise.
