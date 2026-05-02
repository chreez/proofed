---
id: PF-232
title: >-
  Recipe Upgrade Pipeline — structured flow from bake data to recipe version
  bumps
status: Done
assignee: []
created_date: '2026-05-01 04:08'
updated_date: '2026-05-01 05:11'
labels:
  - feature
dependencies:
  - PF-231.1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enhancement to /feedback skill adding a data-driven upgrade mode. Structured flow from accumulated bake data to recipe version bumps.

## Problem

Bake-log captures data (notes, experiment tweaks, scratchpad). Recipe updates from that data are ad-hoc — no structured review/decision/bump flow. The /feedback skill handles interactive recipe review but doesn't process accumulated bake data or experiment variations.

## Decisions (from grooming)

- **Enhance /feedback** — add upgrade mode, not a separate skill
- **Agent surfaces, user decides** — agent scans cook_log for patterns, user picks what graduates
- **Agent-executable** — upgrade mode invocable by other skills/agents with structured input (no interactive prompts for data ingestion)

## Acceptance Criteria

- [ ] /feedback skill gains --upgrade mode (or similar flag) for data-driven recipe review
- [ ] Upgrade mode is agent-executable — can be invoked by other skills/agents with structured input (no interactive prompts required for data ingestion)
- [ ] Upgrade mode scans all cook_log entries for the target recipe
- [ ] Agent surfaces graduation candidates: repeated tweaks, consistent notes across 2+ bakes, experiment variations
- [ ] Candidates presented as structured list with evidence (which bakes, what data)
- [ ] User decides which candidates graduate to recipe baseline
- [ ] Approved changes applied to recipe JSON (ingredient amounts, notes, etc.)
- [ ] Minor version bump + changelog entry for each upgrade session
- [ ] Experiment data from PF-231 consumed when present (slider variations, freeform additions)
- [ ] Existing /feedback interactive review mode unaffected
- [ ] Skill documentation updated with upgrade mode usage
- [ ] npm run build passes

## Dependencies

- PF-231.1: Experiment schema design (defines data format this consumes)
<!-- SECTION:DESCRIPTION:END -->
