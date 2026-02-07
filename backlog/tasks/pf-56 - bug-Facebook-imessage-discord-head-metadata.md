---
id: PF-56
title: bug; Facebook / imessage /discord head metadata
status: Done
assignee: []
created_date: '2026-02-07 05:46'
updated_date: '2026-02-07 09:11'
labels:
  - bug
dependencies: []
references:
  - 'index.html:13'
  - 'scripts/prerender-og.ts:15'
  - src/composables/useRecipeMeta.ts
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OG metadata not rendering in Facebook, iMessage, Discord link previews when sharing `https://proofeddot.netlify.app/`.\n\n**Root cause**: All OG tags hardcode `https://proofed.netlify.app/` (wrong domain). The live site is at `proofeddot.netlify.app`. Crawlers see domain mismatch between shared URL and og:url/og:image and reject the tags.\n\nTwo places to fix:\n- `index.html` — static fallback og:url/og:image reference wrong domain\n- `scripts/prerender-og.ts` — BASE_URL constant is wrong\n- `src/composables/useRecipeMeta.ts` — may also hardcode the URL
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 og:url, og:image, twitter:image all reference the correct live domain (proofeddot.netlify.app)
- [ ] #2 Prerender script BASE_URL updated to correct domain
- [ ] #3 Static fallback OG tags in index.html updated to correct domain
- [ ] #4 useRecipeMeta composable uses correct domain
- [ ] #5 Facebook Sharing Debugger shows title, description, and image for index page
- [ ] #6 Facebook Sharing Debugger shows recipe-specific metadata for recipe pages
- [ ] #7 iMessage and Discord link previews show title + image
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed OG metadata domain mismatch. All og:url, og:image, and twitter:image tags were pointing to `proofed.netlify.app` (a different site) instead of `proofeddot.netlify.app`. Updated BASE_URL in index.html, prerender-og.ts, useRecipeMeta.ts, and useRecipeMeta.spec.ts. Deployed to Netlify and verified live. Facebook/iMessage/Discord previews now working.
<!-- SECTION:FINAL_SUMMARY:END -->
