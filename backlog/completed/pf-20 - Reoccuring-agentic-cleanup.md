---
id: PF-20
title: Reoccuring agentic cleanup
status: Done
assignee: []
created_date: '2026-02-06 18:56'
updated_date: '2026-02-06 19:08'
labels:
  - infra
  - ungroomed
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Think about a pre push / pre commit hook. It analyzes ONLY the changes that are about to be commit. 

Reassesses CLAUDE.md and agentic steering rules (1 sub agent) - and modifies and updates and ammends commit. 

Reassesses all other documentation - usually README.md or version change log (if we have one on the website) or the about page (if it contains details about how this website works)
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented two-part approach: (1) Git pre-commit hook that runs `npm run build` and blocks commits on failure. (2) Agent steering rules in CLAUDE.md — "Recurring Cleanup" section documents the between-task review workflow: check staged changes, update steering docs, check for stale refs, commit per task.
<!-- SECTION:FINAL_SUMMARY:END -->
