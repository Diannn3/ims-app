# IMS App Agent & Skill Pack

Project: UPLB Math Building Academic Hub  
Milestone: 2A — Data-Ready Academic Core  
Created: 2026-08-13

This pack contains the smallest useful agent lineup and reusable skills for implementing the current blueprint. It is a handoff aid, not a command to run every agent simultaneously.

## Recommended Core Lineup

Use 2–4 roles per phase:

1. `planner-sol` — architecture and decision gates; use for ambiguous or security-sensitive slices.
2. `executor-terra` — default implementation engine for SvelteKit, Supabase, imports, and tests.
3. `reviewer-sol` — independent final review of architecture, privacy, RLS, and cross-module regressions.
4. `ims-ui-ux-agent` — SvelteKit-specific UI/accessibility specialist for Steps 6–9 and 12–13.

Do not run planner and reviewer continuously. Planner works before a slice; reviewer works after implementation evidence exists.

## Optional Specialists

- `research-agent` — official IMS/UPLB source verification and provenance research only.
- `import-data-quality-agent` — CSV/schema profiling, duplicate detection, referential integrity, and import acceptance evidence.
- `browser-qa-agent` — mobile, keyboard, screen-reader-adjacent, offline, and visual browser verification.
- `documentation-agent` — source matrix, admin runbooks, migration notes, and handoff documentation.

## Phase Routing

| Phase | Lead | Supporting role/skill |
| --- | --- | --- |
| Step 4.5 security gate | `executor-terra` | `planner-sol`, `reviewer-sol`, security scan reference |
| Step 5 repository | `executor-terra` | `test-driven-development`, `reviewer-sol` |
| Steps 6–8 public UI | `ims-ui-ux-agent` + `executor-terra` | `frontend-design`, `web-design-guidelines` |
| Step 9 search | `executor-terra` | `ims-ui-ux-agent`, `test-driven-development` |
| Steps 10–11 imports | `executor-terra` | `import-data-quality-agent`, `test-driven-development` |
| Step 12 admin preview | `executor-terra` | `ims-ui-ux-agent`, `reviewer-sol`, security diff scan |
| Step 13 map viewport | `ims-ui-ux-agent` | `browser-qa-agent`, `web-design-guidelines` |
| Steps 14–16 grades/PWA | `executor-terra` | `systematic-debugging`, `browser-qa-agent` |
| Step 17 release gate | `reviewer-sol` | browser QA, security scan, documentation |

## Required Load Order

1. Read `project-context/MILESTONE_2A_IMPLEMENTATION_BLUEPRINT.md`.
2. Read the project `AGENTS.md`, `package.json`, migrations, and current routes.
3. Load only the agent prompt for the current role.
4. Load the skills listed for the current phase.
5. Implement one reviewable slice and preserve the blueprint's human approval gates.

## Non-Negotiable Project Overrides

- Framework is SvelteKit 2 + Svelte 5 + TypeScript. Do not switch to Astro, React, or Next.js.
- Use Tailwind only after confirming it is installed or obtaining approval to add it.
- Do not install shadcn, Radix, animation libraries, or heavy dependencies by default.
- Public academic data must be `published` and source-aware.
- Gradebooks remain local-first and outside Supabase by default.
- Static building geometry and dynamic academic schedules remain separate.
- Admin/import actions run server-side and must pass route, RLS, and RPC authorization.
- No deployment, production import, scraping, or publication without explicit approval.

## Pack Structure

```text
agents/             project-specific role prompts
skills/             copied local reusable skills
plugin-references/  installed plugin entrypoints; plugin runtime still required
project-context/    current implementation blueprint
source-agents/      original Fensalir agents for reference
```

## Important Agent 13 Note

The original `13_ui_ux_engineer.md` is included under `source-agents/` for provenance. Its accessibility, state, hierarchy, and mobile rules are reusable. Its Astro/React/shadcn/lucide instructions are not applicable to IMS. Load `agents/ims-ui-ux-agent.md` for this project instead.

