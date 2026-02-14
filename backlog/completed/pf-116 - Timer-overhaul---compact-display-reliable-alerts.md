---
id: PF-116
title: Timer overhaul - compact display + reliable alerts
status: Done
assignee: []
created_date: '2026-02-11 05:09'
updated_date: '2026-02-11 07:31'
labels:
  - feature
  - ux
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make timers actually useful during bakes. Two fronts: (1) visual redesign so short waits don't dominate the screen, (2) notification reliability so you don't lose track when the phone locks or you switch apps. Replaces PF-7 and DRAFT-2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Duration badge renders in step header for all states with duration_min
- [ ] #2 Passive steps (timer:true) show hourglass icon + formatted time
- [ ] #3 Active steps (timer:false) show flame icon + formatted time
- [ ] #4 Duration formats correctly: X min, X hr, X hr Y min
- [ ] #5 No interactive timer controls (play/pause/reset removed)
- [ ] #6 Recipe audit: all passive states have timer:true (3 recipes fixed)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
# PF-116.1 Spike Findings: iOS Clock Deep Link + Safari Notification Research

Research completed 2026-02-10. Sources cited inline.

---

## 1. iOS Clock Deep Link — URL Scheme

### What exists

The iOS Clock app registers several private URL schemes:
- `clock-alarm://`
- `clock-timer://`
- `clock-stopwatch://`
- `clock-worldclock://`
- `clock-sleep-alarm://`

**`clock-timer://` opens the Timer tab in the Clock app.** However, it accepts NO parameters — you cannot pass a duration, name, or start command. It simply opens the tab to whatever the last-used timer state was.

Sources: [iOS Private URL Schemes (GitHub)](https://github.com/rex11458/iOS-Private-URL-Scheme), [iOS URL Schemes Gist](https://gist.github.com/hilen/b425e65d019d9e7fe90fcbced0e3c4fd), [Automators Talk discussion](https://talk.automators.fm/t/ios-alarm-clock-app-with-url-scheme/1745)

### What does NOT work

- `clock-timer://duration=300` — no parameter support
- No way to pre-fill a specific timer duration via URL scheme
- URL parameters reportedly don't work in URL schemes from Shortcuts either

### Alternative: Apple Shortcuts URL Scheme

The Shortcuts app supports running named shortcuts from a URL:

```
shortcuts://run-shortcut?name=[name]&input=[input]&text=[text]
```

**Approach:** Create an Apple Shortcut called "Bake Timer" that accepts a duration as input and runs the "Start Timer" action. Then link to it from the web app:

```
shortcuts://run-shortcut?name=Bake%20Timer&input=text&text=1500
```

**Pros:**
- Can pass duration as input text (seconds or "25 minutes" sentence format)
- Works from Safari — URL schemes work "anywhere a URL can be used, including a web browser" (Apple docs)
- The shortcut can use the native "Start Timer" action which sets the actual iOS timer

**Cons:**
- Requires the user to install the shortcut first (one-time setup)
- Safari shows a confirmation dialog before opening Shortcuts
- Two-step process: Safari → Shortcuts app → timer starts
- If the shortcut doesn't exist, it fails silently or errors

Source: [Apple Support — Run a shortcut from a URL](https://support.apple.com/guide/shortcuts/run-a-shortcut-from-a-url-apd624386f42/ios)

### Alternative: Third-party timer apps

Apps like Timer+ support parameterized URL schemes:
```
timerplus://app/quick-timers/new?hours=0&minutes=25&seconds=0&name=Proof
```

Not viable — requires users to install a specific third-party app.

### Recommendation for PF-116 AC #6

**Revise AC #6.** "Pre-filled duration" is not achievable with the native Clock app. Options:

1. **Option A (simplest):** Use `clock-timer://` to open the Timer tab. User manually sets duration. Label the button "Open iOS Timer" instead of implying pre-fill.

2. **Option B (better UX, more friction):** Use Shortcuts URL scheme. Provide a "Download Shortcut" link for first-time setup, then `shortcuts://run-shortcut?name=Proofed%20Timer&input=text&text={seconds}`. The shortcut itself uses the "Start Timer" action.

3. **Option C (hybrid):** Default to Option A. Show a one-time tooltip: "Want auto-start? Install our shortcut." Link to an iCloud-hosted shortcut.

**My recommendation: Option A for v1, Option C as a future enhancement.** Option A is zero-friction and still useful — user taps, Clock app opens, they set the timer. No setup required.

---

## 2. Web Notification API on iOS Safari

### Current status (iOS 16.4+)

Web Push Notifications are supported on iOS Safari **only as a PWA installed to the home screen**. This is NOT available in regular Safari browser tabs.

Source: [Apple Developer Documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [MagicBell PWA Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [Brainhub PWA on iOS 2025](https://brainhub.eu/library/pwa-on-ios)

### Requirements for web push on iOS

1. **Must be installed as PWA** — user must "Add to Home Screen" from Safari
2. **Manifest must include `"display": "standalone"`** — without this, push is NOT enabled
3. **Permission prompt requires user gesture** — cannot auto-prompt, must be triggered by tap/click
4. **Service worker required** — must register a service worker to handle push events
5. **HTTPS required** (standard for all notification APIs)

### Lock screen behavior

Once permission is granted, **push notifications DO appear on the lock screen**, in Notification Center, and on paired Apple Watch. They behave identically to native app notifications.

### What this means for proofed.

**Timer completion notifications via Web Push are NOT viable for our use case.** Reasons:

- proofed. is used as a regular website in Safari, not a PWA
- Converting to PWA just for timer notifications is high-friction for users
- Push notifications also require a remote push server (APNS via web push protocol) — they cannot be triggered purely client-side
- The `Notification` constructor (local, no server) is also gated behind the PWA requirement on iOS

### Alternative: Local Notification API (non-push)

The `new Notification()` constructor (local, no server needed) works on desktop browsers but is **also restricted to PWA on iOS Safari**. There is no client-side-only notification path on iOS Safari without PWA installation.

### Recommendation for PF-116 AC #5

**Web Notification should be implemented but with clear expectations:**

1. On desktop browsers (Chrome, Firefox, macOS Safari): `new Notification()` works in regular tabs. Implement and use it.
2. On iOS Safari: notifications will silently fail. Do not request permission (it will be denied/ignored).
3. Feature-detect with `'Notification' in window && Notification.permission !== 'denied'`.
4. Consider adding PWA manifest + service worker as a future enhancement (separate task) if user demand exists.

---

## 3. Audio Playback on iOS Safari

### Autoplay restrictions

iOS Safari blocks ALL audio playback that is not initiated by a direct user gesture (tap/click). This applies to both:
- HTML `<audio>` element `.play()`
- Web Audio API `AudioContext`

Source: [Apple Developer Archive](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html), [Matt Montag — Unlock Web Audio](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)

### The "warm up" pattern (RECOMMENDED)

The AudioContext can be "unlocked" during a user gesture, then used freely for the rest of the page lifecycle:

```javascript
// Create context once at page load
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Unlock on first user interaction
function unlockAudioContext(ctx) {
  if (ctx.state !== 'suspended') return;
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const unlock = () => {
    ctx.resume().then(() => {
      events.forEach(e => document.body.removeEventListener(e, unlock));
    });
  };
  events.forEach(e => document.body.addEventListener(e, unlock, false));
}

unlockAudioContext(audioCtx);
```

After this unlock, **you CAN play audio programmatically** (e.g., from a `setTimeout` callback) without another user gesture. The context stays "running" for the page lifecycle.

Source: [Matt Montag](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos), [GitHub Gist — kus](https://gist.github.com/kus/3f01d60569eeadefe3a1)

### Alternative: Silent buffer warm-up

```javascript
// Play an inaudible buffer to "prime" the context
const buffer = audioCtx.createBuffer(1, 1, 22050);
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start(0);
```

This is an older technique. The `resume()` approach above is preferred on modern iOS.

### Edge cases and gotchas

1. **Device mute switch**: Web Audio API does NOT play when the iOS ringer/silent switch is set to silent. HTML `<audio>` and `<video>` elements DO play even on silent. This is a key difference.

2. **"Interrupted" state**: When user leaves the tab, locks the phone, or receives a call, the AudioContext transitions to `"interrupted"` state. Must handle this:
   ```javascript
   audioCtx.onstatechange = () => {
     if (audioCtx.state === 'interrupted') {
       audioCtx.resume();
     }
   };
   ```

3. **Background timer throttling**: `setTimeout`/`setInterval` are throttled or paused when Safari is in the background. Timers may not fire on time. When the tab regains focus, queued callbacks fire in rapid succession.
   - **Web Worker mitigation**: Timers in Web Workers are more reliable than main-thread timers, though still not guaranteed in background.

4. **Multiple AudioContexts**: Safari limits to ~4 simultaneous AudioContext instances. Reuse one global context.

5. **Vibration API**: `navigator.vibrate()` is NOT supported in Safari/iOS Safari. Cannot use haptic feedback as a fallback alert.

Sources: [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [Can I Use — Vibration](https://caniuse.com/vibration), [WebKit Bug 231105](https://bugs.webkit.org/show_bug.cgi?id=231105), [Apple Developer Forums — Timer throttling](https://developer.apple.com/forums/thread/71150)

### Recommendation for PF-116 AC #4

**Use the Web Audio API warm-up pattern:**

1. Create a single `AudioContext` in `useTimer` composable
2. Call `unlockAudioContext()` — it attaches to body touch/click events automatically
3. When the user starts any timer (user gesture), the context gets unlocked
4. On timer completion, play the alert sound through the already-unlocked context
5. Handle the `interrupted` state for tab-switch/lock scenarios
6. Pre-load the alert sound as an AudioBuffer at context creation time

**For timer accuracy in background:**
- Use a Web Worker for the countdown tick
- Store the target end-time (`Date.now() + durationMs`) and compare against system clock on each tick
- When tab regains focus, immediately check if timer has elapsed and fire alert

---

## Summary Table

| Feature | Feasibility | Notes |
|---------|-------------|-------|
| iOS Clock deep link with duration | NOT possible | `clock-timer://` opens app but no params. Shortcuts workaround requires user setup. |
| iOS Clock deep link (open only) | WORKS | `clock-timer://` reliably opens Timer tab |
| Web Notifications (desktop) | WORKS | Standard `new Notification()` in Chrome/Firefox/macOS Safari |
| Web Notifications (iOS Safari) | NOT viable | Requires PWA + home screen install + push server |
| Audio alert (with warm-up) | WORKS | Web Audio API + `resume()` on first user gesture. Fails on mute switch. |
| Background timer accuracy | DEGRADED | Timers throttled when tab hidden. Web Worker + system clock comparison mitigates. |
| Vibration API (iOS) | NOT supported | Safari does not implement `navigator.vibrate()` |

---

## Impact on PF-116 Acceptance Criteria

| AC | Impact |
|----|--------|
| #4 Audio alert | Feasible. Use Web Audio API warm-up pattern. Note: silent switch disables. |
| #5 Web Notification | Feasible on desktop only. iOS Safari: skip gracefully (feature detect). |
| #6 iOS deep link with pre-fill | NOT feasible as written. Revise to "Open iOS Timer" (no pre-fill). |
| #7 iOS-only rendering | Feasible. UA detection or `navigator.maxTouchPoints` heuristic. |
| #8 Independent channels | Feasible. Each channel should try/catch independently. |

## PF-116.4 Timer Audit Report (2026-02-11)

Audited all 8 recipe JSON files (excluding archive/) across 130+ states.

### Changes Made

| Recipe | State ID | State Title | Change | Rationale |
|--------|----------|-------------|--------|-----------|
| atk-cinnamon-buns-ultimate | PREHEAT | Preheat Oven | `timer: false` -> `timer: true` | 15-min passive wait for oven to preheat |
| coco-curry | SIMMER_BROTH | Simmer in Broth | `timer: false` -> `timer: true` | 20-min passive simmer |
| carrot-cake | PREHEAT | Preheat Oven | Added `duration_min: 15`, `timer: true`, `parallel: false`; updated exit_condition | Was missing duration_min entirely; passive preheat wait |

### States Reviewed but Left Unchanged

- **tomita-tsukemen / ADD_AROMATICS**: 60-min boil with "stirring occasionally" -- considered adding `timer: true` but reverted because (a) the test's passive-pattern matching doesn't recognize this state by name, and (b) the step requires periodic attention (stirring). Not a fully passive state.
- **carrot-cake / COOL_BROWN_BUTTER** and **COOL_SPICED_OIL**: Missing `duration_min` and have `timer: false`, but these are "cool to room temperature" steps with temperature-based exit conditions (not time-based). A timer would be misleading since the actual wait varies by environment.

### D4 Compliance Summary

- **No active hands-on states have `timer: true`** across any recipe (verified all 130+ states)
- **All clearly passive states now have `timer: true`**: rise, bake, cool, rest, proof, ferment, steep, chill, soak, marinate, age, pressure cook, preheat, simmer
- All recipe validation tests pass (`npm run build` exits 0)
<!-- SECTION:NOTES:END -->
