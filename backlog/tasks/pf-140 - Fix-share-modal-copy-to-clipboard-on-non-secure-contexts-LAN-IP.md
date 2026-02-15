---
id: PF-140
title: Fix share modal copy-to-clipboard on non-secure contexts (LAN IP)
status: Done
assignee: []
created_date: '2026-02-15 00:56'
updated_date: '2026-02-15 01:00'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Copy Link button in ShareModal silently fails when accessing the site via LAN IP (192.168.1.213:5173) because `navigator.clipboard.writeText()` requires a secure context (HTTPS or localhost). Add `document.execCommand('copy')` fallback for non-secure contexts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Copy Link button works on LAN IP (HTTP, non-secure context) via execCommand fallback
- [x] #2 Copy Link button still works on localhost/HTTPS via Clipboard API
- [x] #3 Shows 'Copied!' confirmation in both paths
- [x] #4 Silent failure path only triggers if both methods fail
- [x] #5 Tests cover secure context path, non-secure fallback, and failure case
<!-- AC:END -->
