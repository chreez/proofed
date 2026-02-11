---
id: PF-1
title: Table of Contents navigation
status: Done
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-06 19:08'
labels:
  - ux
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Need TOC for navigating recipe sections. Consider existing tooling — scrollspy libraries, intersection observer patterns. Don't reinvent the wheel.
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented sidebar TOC with: right-side sticky sidebar (desktop), FAB + bottom sheet (mobile), IntersectionObserver scroll tracking, auto-expand collapsed stages on click, completed stage strikethrough, scroll-to-header navigation. TocPill alternative removed. 10 tests added.
<!-- SECTION:FINAL_SUMMARY:END -->
