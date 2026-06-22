# Setup — tooling & installing this skill

## 1. Install the skill in the repo
Place this whole folder at one of these locations so Claude discovers it:

```
.claude/skills/thh-frontend-clean/      # Claude Code / Cowork (repo-scoped)
```

Commit it. Now any frontend task in the repo can use it (e.g. "build the candidate filters", "clean up this component"), and it triggers automatically on matching work.

Also drop the lean always-on file at the repo root:
```bash
cp .claude/skills/thh-frontend-clean/assets/AGENTS.md.template AGENTS.md
ln -s AGENTS.md CLAUDE.md   # one source of truth for every tool
```

## 2. package.json scripts
```jsonc
{
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest"
  }
}
```

## 3. Config files (copy from assets/)
```bash
cp assets/eslint.config.mjs   ./eslint.config.mjs
cp assets/prettier.config.mjs ./prettier.config.mjs
cp assets/lib/utils.ts        ./src/lib/utils.ts     # if not already present
cp assets/env.ts              ./src/env.ts
```

Install anything missing:
```bash
pnpm add -D prettier prettier-plugin-tailwindcss @eslint/eslintrc typescript-eslint
pnpm add @t3-oss/env-nextjs        # for env.ts (zod already present)
```

Ensure `tsconfig.json` has `"strict": true`.

## 4. Pre-commit hook (husky + lint-staged)
Generated code gets auto-fixed before it lands, which keeps the codebase consistent enough that agents learn patterns by example.

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
echo 'pnpm exec lint-staged' > .husky/pre-commit
```

Add to `package.json`:
```jsonc
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,md,json}": ["prettier --write"]
  }
}
```

Optionally also run a type check before commit (slower) by adding `bash -c 'tsc --noEmit'` to the pre-commit hook.

## 5. Claude Code alternative to a pre-commit hook
Instead of (or in addition to) husky, add a **Stop hook** that runs `pnpm lint --fix && pnpm typecheck` after the agent finishes and feeds any errors back for it to fix. This catches issues in the agent loop itself.

## Notes
- Don't add large prose docs beyond `AGENTS.md` + this skill — context files that restate what tooling enforces hurt agent performance.
- If `AGENTS.md` ever needs more, split into scoped `.cursor/rules/*.mdc` with `globs` rather than growing one monolith.
