---
id: PF-7
title: System timers — OS-level alarms
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:29'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In-browser timers are unreliable — user often closes the browser and loses track. Need persistent notification that survives browser close.\n\nSpike needed to evaluate approaches:\n- Web Notifications API (works if browser stays open)\n- PWA + service worker (survives browser tab close)\n- Deep link to iOS Clock app (sets a real OS timer)\n- macOS Shortcuts/Automator integration\n- Push notifications via service worker\n\nAt minimum: ensure in-app timers fire Web Notifications. Stretch: OS-level persistence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 In-app timers fire Web Notification API alerts
- [ ] #2 Notification works even if user switches tabs
- [ ] #3 Spike: evaluate OS-level persistence options (PWA, deep links, push)
- [ ] #4 Timer state survives page refresh (localStorage or similar)
- [ ] #5 Audio alert accompanies notification
<!-- AC:END -->
