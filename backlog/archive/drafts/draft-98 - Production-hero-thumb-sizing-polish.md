---
id: DRAFT-98
title: Production view — hero thumb sizing polish
status: Draft
assignee: []
created_date: '2026-05-13'
labels:
  - bakery-ops
  - ux
  - polish
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-256.2 demo review (2026-05-13). User feedback: "the hero sizing is quite large." Deferred from PF-256.1 implementation to keep slice scope tight.

Tune the library card banner thumb dimensions on /production so cards feel more catalog-density and less photo-blog. Likely needs:
- Reduce banner aspect ratio (4:3 → 16:9 or similar) so cards are shorter
- Or shift photo to side-thumb layout (Demo A style — 56x56 left of name)
- Or make banner optional / toggleable per user preference
- Verify cart sidebar thumb sizes (32x32) still feel right at chosen banner size
- Test responsive behavior — mobile review mode shouldn't show banners
<!-- SECTION:DESCRIPTION:END -->
