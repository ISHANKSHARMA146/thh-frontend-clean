# thh-frontend-clean

A Claude Code / Cursor / Cowork **skill** that enforces clean, fast, DRY, AI-friendly frontend code for the THH stack: **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind v4**, **TanStack Query v5**, **Zustand v5**, **react-hook-form + Zod**, **shadcn/ui**, **Radix**.

It triggers automatically on any frontend work — building a component/page/feature, adding a data hook, creating a form, wiring an API call, refactoring, cleaning up, or fixing re-renders — and encodes version-specific traps (async params in Next 15, ref-as-prop + React Compiler in React 19, CSS-first `@theme` in Tailwind v4, `useShallow` + slices in Zustand 5, query-key factories in TanStack Query 5).

## What's inside

```
thh-frontend-clean/
├── SKILL.md                      # entry point (auto-loaded by the agent)
├── references/                   # area-specific guides, loaded on demand
│   ├── nextjs.md  react.md  state.md  forms.md
│   ├── components-structure.md  styling.md  performance.md  tooling.md
└── assets/                       # ready-to-use configs
    ├── eslint.config.mjs  prettier.config.mjs  env.ts
    ├── AGENTS.md.template  SETUP.md  lib/utils.ts
```

## Install (Claude Code)

Clone into a repo's skills dir (repo-scoped) or your home skills dir (global):

```bash
# repo-scoped — every frontend task in that repo can use it
git clone https://github.com/ISHANKSHARMA146/thh-frontend-clean.git \
  .claude/skills/thh-frontend-clean-tmp
mv .claude/skills/thh-frontend-clean-tmp/thh-frontend-clean .claude/skills/thh-frontend-clean
rm -rf .claude/skills/thh-frontend-clean-tmp
```

```bash
# OR global — available in every project on your machine
git clone https://github.com/ISHANKSHARMA146/thh-frontend-clean.git /tmp/tfc \
  && cp -R /tmp/tfc/thh-frontend-clean ~/.claude/skills/ && rm -rf /tmp/tfc
```

The agent picks it up automatically. Invoke explicitly with `/thh-frontend-clean`.

## Repo tooling setup (one-time, per project)

Follow `thh-frontend-clean/assets/SETUP.md` — it copies the eslint/prettier/env configs, drops the lean always-on `AGENTS.md` at the repo root, and wires a husky + lint-staged pre-commit hook so generated code is auto-fixed before it lands.

## For the THH team

Pull updates with `git pull`. Edit `SKILL.md` / `references/*` to evolve the rules; keep the prose lean — anything a linter or type checker can enforce belongs in `assets/`, not in the skill text.
