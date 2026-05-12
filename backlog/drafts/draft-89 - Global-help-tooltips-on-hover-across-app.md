---
id: DRAFT-89
title: Global help tooltips on hover across app
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - ux
  - a11y
  - global
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 HITL review (2026-05-12). User feedback: "pretty much every element should have help tooltips on hover."

Establish a reusable tooltip pattern and apply it across the app. Every interactive or jargon-bearing UI element (icons, badges, sliders, computed values, tag chips, legend swatches, phase blocks, scheduler events) should explain itself on hover without requiring the user to dig through docs or guess.

Scope (broad — needs grooming into slices):
1. Tooltip primitive — pick approach (native `title=` is poor on mobile + low contrast; recommend a Vue `<HelpTooltip>` component using popover/anchor positioning).
2. A11y: keyboard-focus reveal (not hover-only), proper ARIA, ESC to dismiss.
3. Touch handling: long-press or tap-to-toggle for mobile.
4. Apply to: PricingView (cost, markup slider, CP%, dirty badge, snap nudge), scheduler demo legend, recipe page badges, version pills, tag chips, gather-section icons.
5. Add validation check (F43) to enforce tooltips on interactive elements in styling/UI tasks going forward.

Out of scope for first slice: animated tooltips, custom styling per surface. Start with one consistent component, apply to PricingView first (just shipped without tooltips).
<!-- SECTION:DESCRIPTION:END -->
