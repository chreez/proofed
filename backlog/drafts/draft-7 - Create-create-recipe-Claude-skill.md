---
id: DRAFT-7
title: Create /create-recipe Claude skill
status: Draft
assignee: []
created_date: '2026-02-11 21:11'
labels:
  - skill
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Formalize the recipe JSON creation process into a reusable Claude skill (`/create-recipe`), similar to how `/research` codifies multi-agent research. The skill should encode every step needed to go from a research synthesis (or raw recipe) to a fully wired-up recipe in the app, so nothing gets missed (like the categoryMap entry).

Covers: recipe JSON creation from synthesis/source, index.json manifest entry, RecipeIndex categoryMap entry, nutrition block, validation gate, original-recipes.md source preservation (when applicable).
<!-- SECTION:DESCRIPTION:END -->
