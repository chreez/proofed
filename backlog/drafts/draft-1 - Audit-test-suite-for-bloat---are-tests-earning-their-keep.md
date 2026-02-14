---
id: DRAFT-1
title: Audit test suite for bloat - are tests earning their keep?
status: Draft
assignee: []
created_date: '2026-02-10 09:27'
labels:
  - dx
  - infra
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Investigate whether the test suite has accumulated low-value tests, redundant coverage, or slow tests that don't catch real bugs. Look at: test count vs actual regression catches, snapshot test value, slow test files, coverage overlap between integration and unit tests. Goal is to understand if we're spending build time on tests that don't protect anything meaningful.
<!-- SECTION:DESCRIPTION:END -->
