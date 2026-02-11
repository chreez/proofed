---
id: PF-98
title: Demo skill for rapid layout prototyping
status: To Do
assignee: []
created_date: '2026-02-10 03:45'
updated_date: '2026-02-10 08:20'
labels:
  - dx
dependencies:
  - PF-102
priority: medium
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a `/demo` skill that streamlines the throwaway demo page workflow. Currently this is a manual loop: create route, create component, wire into App.vue, add test for coverage gate, tear down after. A skill could automate the scaffolding and teardown, letting agents focus on the actual variant code. User has additional ideas to add separately.\n\nDepends on PF-102 (Draft status rework) — skill must reference the new status pipeline, not the deprecated `ungroomed` label.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/demo` skill file exists at `.claude/skills/demo/SKILL.md` and is loadable by agents
- [ ] #2 Skill documents the scaffolding pattern: route in `router/index.ts`, component in `src/components/Demo*.vue`, mock + test in `App.spec.ts`, template branch in `App.vue`
- [ ] #3 Skill defines **comparison mode** (default) — all variants stacked with labels at `/demo/{name}`
- [ ] #4 Skill defines **preview mode** — `?only=N` query param renders single variant full-bleed, no demo chrome
- [ ] #5 Skill includes HITL review loop rules: start dev server with `--host`, open desktop URL via `open`, print LAN URL (`192.168.1.213:5173/...`), wait for user approval
- [ ] #6 Skill guides mode progression: comparison → preview → user locks direction
- [ ] #7 Skill includes teardown checklist: remove Demo*.vue, remove route, remove App.vue import/computed/template, remove test mock + test case
- [ ] #8 Skill is concise — playbook format, not prose
<!-- AC:END -->
