# PF-186 Spike Notes: Indoor Ambient Temperature Measurement Reminder UX

## Executive Summary

This spike investigates the best UX pattern for prompting users to measure indoor ambient temperature before every bake. Ambient temp is the #1 variable affecting fermentation timing in sourdough and other slow-proof recipes.

**Key Finding:** Ecobee API access has been **discontinued as of March 28, 2024** (no new developer subscriptions accepted). **Dedicated WiFi thermometer hardware is the only viable path forward** for auto-capture. Manual entry via scratchpad reminder is the primary interaction pattern.

**Recommended Path:**
1. Add ambient temp as a **pre-bake scratchpad reminder** (fires before any bake state)
2. Wire captured value into `bake_stats.bulk_ambient_temps[0]` as a manual entry (timestamp from reminder response)
3. Optionally integrate dedicated WiFi thermometer hardware (GOVEE H5179 or ThermoPro TP90) with one-click copy-to-app flow for future auto-capture

---

## 1. UX Placement Options (Comparison Table)

| Option | Placement | Trigger | Pros | Cons | Implementation |
|--------|-----------|---------|------|------|-----------------|
| **A: Pre-Bake Checklist** | Modal/dialog before entering first stage | User clicks "Start Bake" button | Guarantees capture before any state; feels like official onboarding; high visibility | Interrupts flow; feels like friction; user might dismiss without measuring | New ChecklistModal component; fires only once per bake |
| **B: Scratchpad Reminder** | Auto-fires at start of `FIRST_STATE` (default first stage) | Built-in reminder system | Integrates with existing scratchpad UX; dismissible; non-blocking; matches current workflow | Can be snoozed/ignored; requires user discipline; fires late if stages skipped | Extend StepReminder schema with `ambient_temp: true` field; prompt templates in recipe JSON |
| **C: Inline Stage Step** | Dedicated top-level state in every recipe | Part of recipe structure | Self-documenting; no modal friction; user sees it in recipe states | Adds visual clutter; every recipe needs it groomed; doesn't feel special vs. other reminders | New mandatory state in recipe schema; UI renders as collapsible section |
| **D: Auto-Capture via Device API** | Silent fetch from Ecobee/WiFi thermometer | Bake session init | Zero friction; automatic; fully reliable for recipes with smart home setup | Requires device onboarding; privacy/auth concerns; fallback to manual if unavailable; complex device lifecycle | Detailed below under Ecobee/hardware research |

### Recommendation: **Hybrid B + D**

Use **Scratchpad Reminder (B) as the default** — it integrates cleanly with the existing reminder system and respects user agency. Optional **auto-capture (D) can layer on top** once hardware is identified (post-MVP).

**Rationale:**
- Scratchpad reminders already exist (`useScratchpad.ts` has `addReminderResponse()` method)
- Non-blocking flow matches proofed.'s principle of scribe, not author
- Users with smart thermometers can add a "quick copy" button next to the input field in future phases
- Simple to test (just measure and enter a temperature)

---

## 2. Recipe-Level Tag Schema for Ambient Temp Tracking

### Proposed Schema Addition to `RecipeConfig`

```typescript
// In src/types/recipe.ts, extend RecipeConfig:

export interface RecipeConfig {
  early_check_percent: number
  stats?: RecipeStats
  bakeStatsSchema?: BakeStatsSchema
  
  // NEW: Ambient temp capture requirements
  ambientTempTracking?: {
    required: boolean        // If true, reminder fires for every bake
    minReadings: number      // Minimum readings per bake (default 1)
    stages: string[]         // Stage IDs where readings should be logged (empty = any time)
    note?: string            // Custom reminder text (e.g., "Before bulk ferment")
  }
}

// Example recipe JSON (simple-sourdough.json):
{
  "config": {
    "early_check_percent": 0.8,
    "stats": { /* ... */ },
    "bakeStatsSchema": { 
      "fields": ["dough_temps", "bulk_ambient_temps", "bake_phases", "stretch_folds", "aliquot_rises"]
    },
    "ambientTempTracking": {
      "required": true,
      "minReadings": 1,
      "stages": ["FERMENT_BULK"],  // Only if bulk ferment exists
      "note": "Check kitchen/room temperature before bulk ferment starts. This affects final proof time."
    }
  }
}
```

### Why This Schema?

1. **Declarative:** Recipe author signals what matters for this recipe
2. **Flexible:** Allows recipes with minimal ferment (pizza) to skip it; sourdough requires it
3. **Composable:** Future `stages` array can expand to multiple capture points (pre-bulk, mid-bulk, pre-proof)
4. **User-Facing Note:** The `note` field becomes the actual reminder text users see

### Integration with useScratchpad

When entering the recipe page, check `config.ambientTempTracking.required`:
- If true and no reminder dismissed: fire `addReminderResponse()` with prompt `"Indoor ambient temperature (°F)"`
- If false: skip entirely

---

## 3. Ecobee API Feasibility Assessment

### Current Status: **DISCONTINUED / NOT VIABLE**

As of **March 28, 2024**, Ecobee closed its developer API subscription program:
- No new developer subscriptions accepted
- Existing API keys continue to work (backward compatible)
- No ETA for reopening

**This kills direct Ecobee API integration for new installations.**

### Technical Details (for reference)

| Aspect | Details |
|--------|---------|
| **Auth Model** | OAuth 2.0 with bearer tokens; access token valid 2 hours, refresh token good for 1 year |
| **Data Accuracy** | Updates every 15 minutes via Runtime object; actual temp updates every 3-5 minutes when equipment state changes |
| **Temperature Format** | Returned in °F (Celsius conversion required for Celsius display) |
| **API Structure** | REST JSON; requires specifying desired columns in request body |
| **Integration Path** | Would require Ecobee account link + OAuth flow in proofed. settings |

### Why It Doesn't Work for proofed.

1. **Closed to new developers:** Can't onboard new users who want this feature
2. **Migration risk:** Existing Ecobee users could lose access if API sunsets entirely
3. **Privacy/scope creep:** Requesting access to HVAC system just for temp reading feels overreaching
4. **Overly specific:** Only helps users who already own Ecobee; ignores 80% of kitchen setups

### Fallback: Seam API

[Seam API](https://docs.seam.co/latest/device-and-system-integration-guides/ecobee-thermostats/get-started-with-ecobee-thermostats) offers a unified interface to Ecobee (and other thermostats) but adds a middleman and is primarily for enterprise/commercial use. **Not recommended for a personal recipe app.**

---

## 4. Hardware Recommendations (Dedicated WiFi Thermometer/Hygrometer)

### Top Options (2026) — Updated After HA Research

> **Update (2026-04-09):** GOVEE H5179 was the original recommendation but was rejected after Home Assistant research. Its WiFi mode requires Govee's cloud; the HA integration is Bluetooth-only (`govee_ble`) with limited range. The user requires fully local operation with no cloud dependency.

| Product | Price* | Connectivity | HA Integration | Accuracy | Local-Only? | Notes |
|---------|--------|--------------|----------------|----------|-------------|-------|
| ~~GOVEE H5179~~ | ~$25–35 | WiFi (cloud) / BT (local) | `govee_ble` (BT only) | ±0.54°F | ❌ WiFi=cloud, BT=flaky range | **Rejected** — WiFi requires Govee cloud; BT unreliable for always-on |
| **Shelly H&T** | ~$35 | WiFi (2.4GHz) | Official `shelly` integration | ±0.5°C | ✅ Fully local HTTP API | **SELECTED** — No hub, no cloud, no subscription. Native local HTTP API. Battery ~1yr |
| ThermoPro TP90 | ~$30–45 | WiFi (cloud) | None official | ±2.0°F | ❌ Cloud required | Disqualified — same cloud problem as Govee |
| Aqara Temp/Humidity | ~$20–30 | Zigbee | Official Zigbee integration | ±0.3°C | ✅ With Zigbee hub | Good accuracy but requires $50–70 hub (total ~$80+) |
| DIY ESPHome | ~$10–15 | WiFi (local) | Official `esphome` integration | Varies by sensor | ✅ Fully local | Most flexible, cheapest. Requires basic assembly |

### Recommendation: **Shelly H&T** (selected by user)

**Why:**
1. **Fully local:** HTTP API on LAN, no cloud account, no subscription, no expiration
2. **Native HA integration:** Auto-discovered via official `shelly` integration
3. **No hub required:** WiFi direct to home network
4. **Plug and play:** No soldering, no assembly, no app required for HA use
5. **Battery powered:** ~1 year battery life, permanent kitchen placement
6. **Queryable:** Local HTTP endpoint can be called from any service on the network

**Future option: DIY ESPHome** if more control or additional sensors needed (humidity, air pressure).

### Manual Entry Pattern (No Hardware)

If user doesn't own a dedicated thermometer:
1. User places kitchen thermometer (any analog/digital) on counter before bake
2. At reminder prompt, user reads thermometer and types value (e.g., `72°F`)
3. Scratchpad captures timestamp + value
4. Value wired to `bake_stats.bulk_ambient_temps[0]`

---

## 5. Data Flow Diagram: Capture → BakeStats

```
┌─────────────────────────────────────────────────────────────┐
│ BAKE SESSION START                                          │
│ (Recipe page load / "Start Bake" click)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Check config.ambientTempTracking│
        │         .required?              │
        └─────────────────────────────────┘
              ↙              ↘
           FALSE            TRUE
             │               │
             │          ┌────────────────────┐
             │          │ Fire StepReminder  │
             │          │ "Indoor temp (°F)"│
             │          │ (on first state)  │
             │          └────────────────────┘
             │                    ↓
             │          ┌─────────────────────┐
             │          │ User enters value   │
             │          │ e.g. "72.5" input   │
             │          └─────────────────────┘
             │                    ↓
             │          ┌──────────────────────────────────┐
             │          │ useScratchpad.addReminderResponse│
             │          │ (stepId="_pre_bake",             │
             │          │  prompt="Indoor temp (°F)",      │
             │          │  value="72.5")                   │
             │          └──────────────────────────────────┘
             │                    ↓
             │          ┌──────────────────────────────────┐
             │          │ Export via useScratchpad          │
             │          │ .exportJson()                     │
             │          └──────────────────────────────────┘
             │                    ↓
    ┌────────┴────────┐  ┌──────────────────────┐
    │  Cook Log Entry │  │ Scratchpad Payload   │
    │   (bake_stats)  │  │ (generalNotes or     │
    └────────┬────────┘  │  entries._pre_bake)  │
             │           └──────────────────────┘
             │
      ┌──────┴──────────────────────────┐
      │ Post-Bake: Curate Notes & Stats │
      └──────┬──────────────────────────┘
             │
      ┌──────┴────────────────────────────────────┐
      │ Convert reminder response to BakeStatsBlock│
      │ value="72.5" →                             │
      │  {                                         │
      │    date: "2026-04-09",                    │
      │    temp_f: 72.5,                          │
      │    note: "manual entry from reminder"     │
      │  }                                         │
      └──────┬────────────────────────────────────┘
             │
      ┌──────┴──────────────────────────────────────┐
      │ Wire into CookLogEntry.bake_stats:         │
      │ {                                           │
      │   bulk_ambient_temps: [                     │
      │     { date, temp_f, note }  ← NEW READING  │
      │   ],                                        │
      │   dough_temps: [...],                       │
      │   ...                                       │
      │ }                                           │
      └──────┬──────────────────────────────────────┘
             │
      ┌──────┴─────────────────┐
      │ BakeStatsBlock renders  │
      │ "bulk ambient" tile     │
      │ showing avg temp        │
      └─────────────────────────┘
```

### Field Name: `bulk_ambient_temps` (already exists!)

The `BakeStatsBlock` type already has `bulk_ambient_temps?: BulkAmbientTemp[]`. Perfect.

**No schema change needed.** Just populate it:

```typescript
interface BulkAmbientTemp {
  date: string              // "2026-04-09" (bake date)
  temp_f: number            // e.g. 72.5
  note?: string             // "manual entry from reminder" or "GOVEE H5179 reading"
}
```

---

## 6. Scratchpad Integration Analysis

### Existing System (useScratchpad.ts)

Current reminder flow:
```typescript
function addReminderResponse(stepId: string, prompt: string, value: string): void
```

**What It Does:**
- Stores reminder responses keyed by `stepId` (stage/state ID) + `prompt` text
- Dismissible (tracks `dismissedReminders[stepId::prompt]`)
- Saves to localStorage per recipe
- Exported via `exportJson()` as `ScratchpadEntry[]`

### Proposed Integration

1. **Add pre-bake pseudo-step:**
   - Reserve `stepId = "_pre_bake"` for ambient temp entry
   - Fire reminder before entering first actual state
   - Prompt: `"Indoor ambient temperature (°F)"`

2. **Detect and extract in post-bake flow:**
   - When user exports scratchpad (manual or auto), search for entry with `stepId="_pre_bake"` and matching prompt
   - Parse `value` as float
   - Create `BulkAmbientTemp` with timestamp from scratchpad entry
   - Append to `bake_stats.bulk_ambient_temps[]`

3. **UI Component (new or extend):**
   - If `ambientTempTracking.required`, show modal/banner before first state
   - Text: `"Before starting, what's your kitchen temperature (°F)?"` + custom note from recipe
   - Input: numeric + unit selector (°F / °C)
   - On submit: call `useScratchpad.addReminderResponse()` 
   - On dismiss: call `useScratchpad.dismissReminder()` (snooze for this bake only)

### Why This Works

- **Reuses existing machinery:** No new localStorage structure; scratchpad already handles entry storage
- **Non-blocking:** User can skip (dismissed) and enter it later if needed
- **Composable:** Future phases can add humidity (°F + %RH) without schema changes
- **Scratchpad export:** CLI skill or future logging tools already export the reminder, so temperature is captured in the curated notes

### Code Touch Points

1. **src/types/recipe.ts:** Add `ambientTempTracking` to `RecipeConfig`
2. **src/composables/useScratchpad.ts:** No changes (already supports reminder responses)
3. **New component:** `PreBakeAmbientTempPrompt.vue` (modal or top-of-page banner)
4. **BakeDetailView or post-bake flow:** Extract and convert reminder response to `BulkAmbientTemp`

---

## 7. Hardware Auto-Capture Integration (Future, Post-MVP)

### Vision (Phase 2+)

Once MVP ships with manual entry working:

1. **User Settings Page**
   - "Connect Thermometer" → Select device type (GOVEE / ThermoPro / Eve)
   - OAuth/API key entry
   - Test connection UI

2. **Auto-Fetch at Bake Start**
   - Fetch latest reading from device API
   - Pre-fill reminder input with device value + timestamp
   - User can override if needed
   - Full transparency: "Reading from GOVEE H5179 at 72.5°F"

3. **Source Tracking**
   - `BulkAmbientTemp.note` = `"GOVEE H5179 (auto-captured)"` vs. `"manual entry"`
   - BakeStatsBlock can badge readings with source

4. **WiFi Thermometer API Integration**
   - GOVEE: REST API (requires API key from app settings)
   - ThermoPro: Home App reverse-engineered or direct HTTP pull
   - Eve: HomeKit thread relay (requires HomeKit setup)

### MVP Scope: **Defer Hardware Integration**

For now, just build the scratchpad reminder + manual entry. This is 80% of the value for 20% of the complexity.

---

## 8. Interaction with Existing Scratchpad/Reminder System

### Comparison: Current vs. Proposed

| Aspect | Current Reminders (e.g., stretch-fold timing) | Ambient Temp (Proposed) |
|--------|----------------------------------------------|------------------------|
| **Trigger** | During stage (e.g., "BULK_FERMENT" state timer) | Before first state (pre-bake) |
| **Dismissible?** | Yes (user can skip) | Yes (but recipe can enforce via UI) |
| **Persistent?** | Yes (stored in scratchpad) | Yes (same mechanism) |
| **Required?** | No (reminders are hints) | Conditional (per recipe via `config.ambientTempTracking.required`) |
| **Rendered** | Inline in StateStep component | Modal/banner at top of RecipePage |
| **Export** | Included in scratchpad JSON export | Converted to bake_stats, also in scratchpad |

### No Breaking Changes

The scratchpad system doesn't change. We're just using an existing `StepReminder` with a special `stepId` and payload shape.

---

## 9. Implementation Roadmap (Not In Scope, But Documented)

### Phase 1: MVP (Scratchpad Manual Entry)
- [ ] Add `ambientTempTracking` to `RecipeConfig` type
- [ ] Create `PreBakeAmbientTempPrompt.vue` component (modal or banner)
- [ ] Wire reminder response to scratchpad on "Start Bake"
- [ ] Extract ambient temp from scratchpad in post-bake flow
- [ ] Create `BulkAmbientTemp` entry and append to `bake_stats`
- [ ] Verify rendering in BakeStatsBlock (already supports it)
- [ ] Document in CLAUDE.md for future agents
- [ ] Add example to simple-sourdough.json

### Phase 2: Thermometer Hardware Integration (Future Spike)
- [ ] Research GOVEE/ThermoPro API availability
- [ ] Build device connection settings UI
- [ ] Implement auto-fetch on bake start
- [ ] Add source tracking to `BulkAmbientTemp.note`
- [ ] Test with real hardware

### Phase 3: Advanced (Post-Phase 2)
- [ ] Humidity capture (extend to `%RH`)
- [ ] Multiple capture points (pre-bulk, mid-bulk, post-bulk)
- [ ] Batch devices (monitor fermentation jar in banneton during proof)
- [ ] Push notifications (e.g., "Your bulk ferment is at 80°F, expect faster timeline")

---

## 10. Open Questions for Clarification

1. **Unit preference:** Should reminder default to °F or user's locale? (Recommend °F as US-centric app, with toggle)
2. **Multiple readings per bake:** Should users be able to log ambient temp multiple times during a single bake? (Yes, but MVP captures once at start)
3. **Recipes without fermentation:** Should recipes like pizza or cookies skip the reminder entirely? (Yes, via `ambientTempTracking.required = false`)
4. **Mobile vs. desktop:** Should the prompt be different on mobile (smaller screen)? (Use responsive modal, same logic)
5. **Timezone handling:** Should ambient temp be timestamped in user's local TZ or UTC? (Recommend local, mirror dough_temps behavior)

---

## Sources & References

- [Ecobee API Developer Documentation](https://www.ecobee.com/en-us/developers/)
- [Ecobee Authentication Guide](https://docs.sb.ecobee.com/docs/authentication-guide)
- [Seam API: Ecobee Thermostat Integration](https://docs.seam.co/latest/device-and-system-integration-guides/ecobee-thermostats/get-started-with-ecobee-thermostats)
- [GOVEE H5179 WiFi Thermometer](https://gagadget.com/en/157631-best-wifi-temperature-sensor/) — Swiss-made sensor, ±0.54°F accuracy
- [ThermoPro TP90 WiFi Thermometer](https://temppro.com/products/tp90-wifi-thermometer-hygrometer) — AC-powered, unlimited sensors, Alexa integration
- [Eve Room HomeKit Sensor](https://www.evehome.com/en/eve-room) — HomeKit native, air quality + temp + humidity, rechargeable
- [Best Indoor Thermometers 2026 - Bob Vila](https://www.bobvila.com/articles/best-indoor-thermometer/)
- [Best WiFi Thermometers 2026](https://weatherstationadvisor.com/best-remote-temperature-monitor/)

---

## Summary

**Ecobee API is not viable (discontinued).** The recommended approach is a **two-phase solution:**

1. **Phase 1 (MVP):** Scratchpad-based manual entry before bake starts, wired into existing `bulk_ambient_temps` field. Low friction, integrates with existing systems, requires zero hardware.

2. **Phase 2+ (Optional):** GOVEE H5179 ($25–35, Swiss-made ±0.54°F accuracy) or ThermoPro TP90 ($30–45, AC-powered) hardware for auto-capture with API integration.

**Recommended recipe tag schema** (new `config.ambientTempTracking` field) allows recipe authors to declare whether ambient temp is required, reducing noise for recipes where it doesn't matter.

No changes to existing `BakeStatsBlock` or scratchpad infrastructure needed — ambient temp already has a home in `bake_stats.bulk_ambient_temps[]`.
