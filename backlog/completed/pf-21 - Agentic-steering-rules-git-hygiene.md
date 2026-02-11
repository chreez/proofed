---
id: PF-21
title: Agentic steering rules - git hygiene
status: Done
assignee: []
created_date: '2026-02-06 18:58'
updated_date: '2026-02-06 19:08'
labels:
  - infra
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
I prefer logical commits with each commit being either a feature or clear commit per change. 

I prefer smaller commits. But each commit should result in full build passing. 

I want agent to remember to do this in between backlog item completions. 

I want the git commit message to include backlinks to backlog.md task id if it exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Commit convention documented in CLAUDE.md
- [x] #2 Commits reference backlog task ID (e.g. PF-17) when applicable
- [x] #3 Each commit passes npm run build
- [x] #4 One logical change per commit — no mixed features
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Git Commit Convention section to CLAUDE.md: one logical change per commit, must pass build, reference PF-XX task IDs, commit between backlog items, conventional commit types.
<!-- SECTION:FINAL_SUMMARY:END -->
