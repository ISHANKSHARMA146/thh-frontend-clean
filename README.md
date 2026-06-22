# thh-frontend-clean

Two paired Claude Code **skills** that keep the THH frontend clean, fast, DRY, and easy for humans and AI agents to navigate. Stack: **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind v4**, **TanStack Query v5**, **Zustand v5**, **react-hook-form + Zod**, **shadcn/ui + Radix**, plus the repo's real integrations — a thick `services/` layer, **next-auth**, **Sanity**, **TanStack Table/Virtual**, **socket.io**, **dnd-kit**, **recharts**, **posthog**.

## Two modes

| Command | Mode | What it does |
|---|---|---|
| **`/thh-fe-audit`** | read-only | Scans code, reports clean/fast/DRY/AI-friendly violations as a tiered report with `file:line` + suggested fix. **Changes nothing.** Use for review, PRs, scoping a cleanup. |
| **`/thh-fe-code`** | apply | Applies the confirmed findings from an audit, or writes new code clean-by-construction. Edits/splits/refactors, then verifies with `pnpm typecheck` + `pnpm lint --fix`. |
| **`/thh-fe-antiai`** | anti-slop | Enforces THH's own design system, tokens, and existing primitives — kills generic AI slop (reinvented components, hardcoded `gray-*`/`white`/hex/Inter/purple, defensive bloat, `any`, missing states). Reviews or enforces-while-writing. |

Audit is the cure-diagnosis; code is the fix + the prevention; anti-slop keeps it looking like THH wrote it, not an LLM. All three share one rulebook (`thh-fe-audit/references/` + `assets/`).

## What's inside

```
thh-fe-audit/                     # /thh-fe-audit skill (read-only)
├── SKILL.md                      # audit workflow + tiered report format
├── references/                   # shared rulebook (loaded on demand)
│   ├── data-layer.md             # services thick→thin, fetch, caching, prefetch
│   ├── integrations.md           # next-auth, Sanity, Table/Virtual, socket, dnd, recharts, posthog, dup libs
│   ├── anti-ai-slop.md           # THH design system, slop catalog (bad→THH), breadcrumb checklist
│   ├── components-structure.md   # structure, composition, god-file split rules
│   ├── state.md  nextjs.md  react.md  styling.md  forms.md
│   ├── performance.md  tooling.md
├── assets/                       # ready-to-use configs
│   ├── eslint.config.mjs  prettier.config.mjs  env.ts
│   ├── AGENTS.md.template  SETUP.md  lib/utils.ts
├── thh-fe-code/
│   └── SKILL.md                  # /thh-fe-code skill (apply); reads the same references/
└── thh-fe-antiai/
    └── SKILL.md                  # /thh-fe-antiai skill (anti-slop); reads the same references/
```

## Install (Claude Code)

Both skills live in one repo. `thh-fe-code` is nested under `thh-fe-audit/` and surfaced as its own command via a symlink (same pattern as `thh-clean`/`thh-code`).

**Global (every project on your machine):**
```bash
git clone https://github.com/ISHANKSHARMA146/thh-frontend-clean.git /tmp/tfc
cp -R /tmp/tfc/thh-fe-audit ~/.claude/skills/thh-fe-audit
ln -sfn ~/.claude/skills/thh-fe-audit/thh-fe-code   ~/.claude/skills/thh-fe-code
ln -sfn ~/.claude/skills/thh-fe-audit/thh-fe-antiai ~/.claude/skills/thh-fe-antiai
rm -rf /tmp/tfc
```

**Repo-scoped (one project):**
```bash
git clone https://github.com/ISHANKSHARMA146/thh-frontend-clean.git /tmp/tfc
cp -R /tmp/tfc/thh-fe-audit .claude/skills/thh-fe-audit
ln -sfn "$PWD/.claude/skills/thh-fe-audit/thh-fe-code"   .claude/skills/thh-fe-code
ln -sfn "$PWD/.claude/skills/thh-fe-audit/thh-fe-antiai" .claude/skills/thh-fe-antiai
rm -rf /tmp/tfc
```

Reload skills (`/reload-plugins` in Claude Code) — `/thh-fe-audit`, `/thh-fe-code`, and `/thh-fe-antiai` all appear.

## Typical loop

```
/thh-fe-audit src/services/job-service.ts   →  tiered report, top-3 fixes
# you confirm which to fix
/thh-fe-code  apply the Tier-1 findings      →  edits + typecheck + lint
```

## Repo tooling setup (one-time, per project)

Follow `thh-fe-audit/assets/SETUP.md` — copies the eslint/prettier/env configs, drops the lean always-on `AGENTS.md` at the repo root, and wires husky + lint-staged so generated code is auto-fixed before it lands.

## For the THH team

`git pull` to update. Edit `thh-fe-audit/references/*` to evolve the rules — both modes read the same files, so a rule added once applies to audit and apply. Keep the prose lean: anything a linter or type checker can enforce belongs in `assets/`, not the skill text.
