---
id: PF-101
title: Personal site ecosystem — shared design DNA + portfolio hub
status: To Do
assignee: []
created_date: '2026-02-10 04:06'
updated_date: '2026-02-14 03:30'
labels:
  - architecture
  - branding
dependencies: []
priority: medium
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extract shared design conventions across personal sites (proofed., vyra, deadlock-fight-club) into a reusable foundation. Build a portfolio hub linking all projects.

**Sites:**
- proofed. (Vue + UnoCSS) — https://proofed.netlify.app
- vyra (React + Mantine) — https://vyra-io.netlify.app
- deadlock-fight-club (React + custom CSS) — https://deadlock-fights.netlify.app
- Throwaway sites (deep-space-10, etc.) — stay independent

**Shared design tokens:** Spacing scale, typography scale (mono + sans), border conventions — framework-agnostic CSS custom properties. Each site imports and maps to its own palette.

**Portfolio hub:** Chris Palmer portfolio page linking to all active projects. Could live on its own domain or as a section on one of the sites.

**Constraints:**
- Each site keeps its own identity, palette, and purpose
- Throwaway sites are not coupled to the shared system
- Framework divergence (Vue vs React) means shared layer must be CSS-only or framework-agnostic

**Related:** DRAFT-10 (brand copy — "AI generates, human proves") may land on the portfolio hub.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Shared design tokens package exists (CSS custom properties for spacing, typography, borders)
- [ ] #2 At least two sites consume the shared tokens alongside their own branding
- [ ] #3 Portfolio hub page exists linking to all active projects
- [ ] #4 Throwaway sites are not coupled to the shared system
- [ ] #5 Each site retains its own palette and brand identity
<!-- AC:END -->
