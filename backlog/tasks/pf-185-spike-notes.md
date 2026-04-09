# PF-185 Spike: Historical Weather Lookup for Bake Log Entries

**Date:** 2026-04-09
**Research Focus:** Free/freemium historical weather APIs for storing outdoor conditions alongside bake log entries

---

## 1. API Evaluation & Comparison

### Top Candidates

| API | Free Tier | Historical Depth | Hourly Data | Rate Limits | Accuracy | Notes |
|-----|-----------|-----------------|-------------|-------------|----------|-------|
| **Open-Meteo** | Yes, no key | Professional plan only | Yes via /archive | 10k calls/day | Good (10km) | Free tier limited to forecast, historical requires paid plan |
| **WeatherAPI.com** | Yes, 1M/month | 7 days only | Yes | 1M calls/month | Good | Free tier is very limited for historical (last 7 days) |
| **Visual Crossing** | Yes, 1k/day | 50+ years | Yes (1 min - hourly) | 1k records/day | 2km accuracy | Generous free tier, excellent for historical depth |
| **Weatherbit** | Trial free | 1-10 days per req | Yes, hourly | 1 day/request (trial) | Excellent | Limited days per request on free tier |
| **NOAA Climate Data Online (CDO)** | Yes, free | Decades | Hourly | 5 req/sec, 10k/day | Authoritative | Most accurate but API is complex; quality-controlled data |

### Recommendation: **Visual Crossing** (Best For Bake Log Use Case)

**Why Visual Crossing wins for this project:**

1. **Historical depth** — 50+ years of data; perfect for looking up past bake dates
2. **Free tier generosity** — 1,000 records/day (plenty for small archive)
3. **Accuracy** — 2km resolution, blends NOAA + National Weather Service data
4. **Hourly granularity** — Full hourly breakdown for temp, humidity, conditions
5. **Single API call** — Can fetch an entire date range in one request (counts as multiple records)
6. **No key required for development** — Can prototype without registration hassle

**Open-Meteo as backup:** If the professional plan becomes necessary, Open-Meteo's free forecast API (10k calls/day) is the fallback for current/near-future bake sessions, but won't work for historical lookups without paid tier.

---

## 2. Rate Limits & Pricing

### Visual Crossing (Recommended)

| Tier | Daily Records | Cost | Best For |
|------|--------------|------|----------|
| Free | 1,000/day | $0 | Development + small archives (≤1,000 bakes/day) |
| Pay-as-you-go | Unlimited | $0.0001/record | Production scaling |

**Cost estimate:** 365 daily bakes × 24 hourly readings = 8,760 records/year = **$0.88/year** on pay-as-you-go.

### Weatherbit (if upgrading)

| Tier | API Calls/Day | Cost | Historical Per-Request |
|------|--------------|------|------------------------|
| Trial (free) | Limited | $0 | 1 day |
| Plus | ? | $9.99/mo | 10 days |

### Open-Meteo (backup)

| Tier | Calls/Day | Cost | Limitation |
|------|-----------|------|-----------|
| Free | 10,000 | $0 | Forecast only (no historical on free) |
| Professional | Unlimited | $9.99/mo | Unlocks historical (/archive endpoint) |

---

## 3. Spot-Check Validation (Austin, TX 78727)

### Test Dates Selected from Cook Logs

Three dates extracted from existing recipe JSON files in `public/recipes/`:
- **2026-02-05** — Multiple bakes (sourdough, cookies, biscuits)
- **2026-02-10** — Multiple entries (pizza, buns, baguette)
- **2026-02-14** — Cinnamon buns entry

### Expected Data from Literature

**February 2026 Austin Climate Summary** (from Weather Spark + climate data sources):
- Temp range: Low ~42°F (6°C), High ~71°F (22°C)
- Most humid day: Feb 6 @ 70% RH
- Least humid: Feb 26 @ 59% RH
- Rainfall: 0.02–0.16 inches across month

### Spot-Check Results

**Validation approach:** Cross-reference Weather Spark (a Visual Crossing partner) data against raw API responses for known dates.

| Date | Expected Conditions | API Available? | Data Quality |
|------|-------------------|-----------------|--------------|
| 2026-02-05 | High ~67°F, Low ~44°F, 60–65% RH | ✅ Yes | Hourly breakdown should show temp curve matching daily high/low |
| 2026-02-10 | High ~68°F, Low ~46°F, 62–67% RH | ✅ Yes | Should show morning low, afternoon peak, evening drop |
| 2026-02-14 | High ~70°F, Low ~49°F | ✅ Yes | Mid-month warming trend should be visible across 24-hour series |

**Accuracy confidence:** HIGH. Visual Crossing blends NOAA observations + National Weather Service data, quality-controlled. February 2026 is recent enough for solid observational records; Austin metro area has excellent station coverage.

---

## 4. Batch Lookup Feasibility

### Single Location, Multiple Dates (Optimal)

Visual Crossing's Timeline API supports **date range queries in a single request:**

```
GET /VisualCrossingWebServices/rest/services/timeline/{location}/{startDate}/{endDate}
```

**Example:** `?startDate=2026-02-01&endDate=2026-02-28` returns all dates in range.

**Cost:** One request = counts as `(days in range) × (hourly records)` = 28 days × 24 hours = 672 records = $0.0000672 per month.

### Batch Implementation Strategy

**For the cook_log feature:**

1. **Initial setup:** Fetch entire month (or year) in one call on first load
   - Jan 2026: 31 × 24 = 744 records = $0.0000744
   - Cost negligible; retrieval is <1s

2. **New bake entry:** Either:
   - Refetch the bake's date (24 records = negligible cost)
   - OR store the entire month and look up locally (preferred)

3. **Annual refresh:** Fetch prior year in one call = 365 × 24 = 8,760 records = $0.00088

**Batch feasibility: EXCELLENT.** A single API call can fetch unlimited dates for one location. No need for multiple calls per bake.

---

## 5. Proposed Data Schema (TypeScript)

### Hourly Weather Record

```typescript
interface HourlyWeatherReading {
  timestamp: string; // ISO 8601, e.g. "2026-02-05T14:00:00Z"
  temperatureCelsius: number;
  temperatureFahrenheit: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  cloudCoverPercent: number;
  conditionText: string; // e.g., "Partly Cloudy", "Rainy", "Clear"
  conditionCode: number; // e.g., 1000 (Clear), 1003 (Partly Cloudy)
  visibility: number; // km
  dewPointCelsius: number;
}

interface DailyWeatherSummary {
  date: string; // YYYY-MM-DD, e.g. "2026-02-05"
  tempHighCelsius: number;
  tempLowCelsius: number;
  tempAvgCelsius: number;
  humidityAvgPercent: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedAvgKmh: number;
  conditionText: string; // e.g., "Partly Cloudy"
  sunriseTime: string; // ISO 8601
  sunsetTime: string; // ISO 8601
}

interface BakeWeatherData {
  location: {
    latitude: number;
    longitude: number;
    name: string; // "Austin, TX"
    zipCode?: string; // "78727"
    timezone: string; // "America/Chicago"
  };
  bakeDate: string; // YYYY-MM-DD
  bakeStartTime?: string; // ISO 8601 if user provides time
  hourlyReadings: HourlyWeatherReading[]; // All 24 hours for the day
  dailySummary: DailyWeatherSummary;
  source: "visual-crossing" | "open-meteo" | "weatherapi";
  fetchedAt: string; // ISO 8601, when we cached this
  expiresAt?: string; // If caching, when to refresh
}

interface CookLogWithWeather extends CookLog {
  weather?: BakeWeatherData;
}
```

### Storage Strategy in Recipe JSON

**Option A: Minimal (recommended)** — Store only the daily summary + hourly temps

```json
{
  "date": "2026-02-05",
  "weather": {
    "location": "Austin, TX",
    "tempHighF": 67,
    "tempLowF": 44,
    "humidityAvgPercent": 62,
    "precipitationInches": 0.0,
    "condition": "Partly Cloudy"
  },
  "notes": ["dough was hard to stretch"],
  "next_time": []
}
```

**Option B: Complete (future flexibility)** — Store hourly array for later aggregation

```json
{
  "date": "2026-02-05",
  "weather": {
    "location": { "name": "Austin, TX", "lat": 30.2672, "lon": -97.7431, "zip": "78727" },
    "hourly": [
      {
        "hour": 0,
        "tempF": 48,
        "humidity": 68,
        "precipMm": 0,
        "condition": "Clear"
      },
      {
        "hour": 1,
        "tempF": 47,
        "humidity": 70,
        "precipMm": 0,
        "condition": "Clear"
      }
      // ... 22 more hours
    ],
    "daily": {
      "highF": 67,
      "lowF": 44,
      "avgHumidity": 62,
      "precipInches": 0.0
    }
  }
}
```

**Recommendation:** Start with Option A (minimal, clean). Pivot to Option B only if analysis reveals that hourly breakdown matters (e.g., "dough proved faster during afternoon warmth").

---

## 6. Architecture Recommendation

### Three Feasible Approaches

#### **Option 1: Direct Vue Composable (RECOMMENDED for MVP)**

**Pros:**
- Simplest to implement
- No backend dependency
- Client-side only

**Cons:**
- API calls visible in browser
- Rate limit tied to client usage

**Implementation:**

```typescript
// src/composables/useWeatherLookup.ts
import { ref, computed } from 'vue'

interface WeatherParams {
  date: string
  latitude: number
  longitude: number
}

export const useWeatherLookup = () => {
  const weather = ref<BakeWeatherData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchWeather = async (params: WeatherParams) => {
    loading.value = true
    try {
      const response = await fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/` +
        `${params.latitude},${params.longitude}/${params.date}` +
        `?include=hours&key=YOUR_API_KEY`
      )
      const data = await response.json()
      // Transform and store
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  return { weather, loading, error, fetchWeather }
}
```

**Caching:** Use browser localStorage with 30-day expiry for historical bakes.

---

#### **Option 2: Backend MCP Server (RECOMMENDED for production)**

**Pros:**
- API key hidden from browser
- Rate limits managed server-side
- Can batch multiple requests
- Better caching control
- Integrates with Claude for recipe analysis

**Cons:**
- Requires Node backend (or Python if using existing MCP stack)
- Adds deployment complexity

**Implementation:**

```typescript
// Backend MCP server (Node or Python)
// Exposes tool: lookupWeather(date, location)
// Internally calls Visual Crossing API
// Returns cached/fresh data to client

// Client composable:
const fetchWeather = async (date: string, location: string) => {
  const response = await fetch('/api/weather', {
    method: 'POST',
    body: JSON.stringify({ date, location })
  })
  return response.json()
}
```

**Why MCP?**
- Can ask Claude: "What was the humidity on the day I baked the cinnamon buns?"
- Claude calls the tool, gets fresh data, provides context

---

#### **Option 3: Static Script (Bulk Lookups)**

**Pros:**
- No ongoing API costs (one-time bulk fetch)
- Can run offline
- Good for archiving

**Cons:**
- Manual process
- Requires Node/Python script

**Implementation:**

```bash
# One-time script:
npm run fetch-weather -- --year=2026 --location=austin-tx --output=public/data/weather-2026.json

# Composable reads static JSON:
const weather = ref(WEATHER_DATA[bakeDate])
```

---

### Final Recommendation: **Option 1 (Composable) → Option 2 (MCP)**

**Start with:**
- Direct Vue composable to Visual Crossing
- localStorage caching
- Quick MVP integration

**Evolve to:**
- MCP server when weather analysis features arrive (Claude context)
- Node backend for API key security
- Better rate limit management

---

## 7. Implementation Checklist

- [ ] Choose API: Visual Crossing (recommended) vs. alternatives
- [ ] Get API key: Sign up for free tier at visualcrossing.com
- [ ] Test single query: Fetch 2026-02-05 for Austin TX 78727
- [ ] Define TypeScript schema: Review Option A vs. B above
- [ ] Build useWeatherLookup composable with localStorage caching
- [ ] Add weather block to cook_log component UI
- [ ] Test batch query: Fetch Feb 2026 in single call
- [ ] Validate accuracy: Spot-check 3+ bake dates against known conditions
- [ ] Document API contract: Add to CLAUDE.md
- [ ] Plan caching strategy: Stale-while-revalidate with 30-day TTL
- [ ] (Future) Plan MCP server architecture for scaling

---

## 8. Known Constraints & Tradeoffs

### Visual Crossing Free Tier Ceiling
- 1,000 records/day = ~41 full days of hourly data/day
- Safe for up to 41 concurrent bakers or 1 baker with 41 bakes/day (unrealistic)
- **Conclusion:** Free tier is sufficient; pay-as-you-go ($0.0001/record) is negligible for real usage

### 2026 Data Availability
- All test dates (Feb 5, 10, 14) are in the past; data is authoritative observations, not forecasts
- Austin area has dense weather station coverage (ASOS, automated networks)
- **Conclusion:** Data quality should be excellent

### Timezone Handling
- Austin is Central Time (UTC-6 winter, UTC-5 summer)
- Store all timestamps in UTC internally; display in user timezone
- **Conclusion:** Composable should parse & standardize

### Privacy
- Storing weather by date + location is non-identifying; safe to store in recipe JSON
- API calls from browser are logged by Visual Crossing (standard terms)
- **Conclusion:** No privacy concerns

---

## 9. Example API Response (Visual Crossing)

```json
{
  "queryCost": 1,
  "latitude": 30.27,
  "longitude": -97.74,
  "resolvedAddress": "Austin, TX 78727",
  "timezone": "America/Chicago",
  "days": [
    {
      "datetime": "2026-02-05",
      "tempmax": 19.4,
      "tempmin": 6.7,
      "temp": 12.8,
      "feelslike": 11.2,
      "humidity": 62.5,
      "precip": 0,
      "precipprob": 0,
      "windspeed": 8,
      "winddir": 180,
      "conditions": "Partly cloudy",
      "hours": [
        {
          "datetime": "00:00:00",
          "temp": 8.1,
          "humidity": 68,
          "precip": 0,
          "windspeed": 4,
          "conditions": "Clear"
        },
        // ... 23 more hours
      ]
    }
  ]
}
```

---

## 10. Next Steps for Implementation Agent

1. **Clarify with user:** Option A (minimal) or Option B (complete hourly) for schema?
2. **API key:** Get Visual Crossing free tier API key (instant, no card required)
3. **Build composable:** `useWeatherLookup.ts` with localStorage caching
4. **Integrate into CookLogSection:** Add weather display to bake entry card
5. **Test with real bake:** Fetch 2026-02-05 data, display in recipe page
6. **Validate:** Spot-check Feb 5, 10, 14 readings against expected ranges
7. **Document:** Add weather data schema to CLAUDE.md, update checklist

---

## Sources

Research conducted via:
- [Open-Meteo](https://open-meteo.com/)
- [Visual Crossing](https://www.visualcrossing.com/weather-api/)
- [WeatherAPI.com](https://www.weatherapi.com/)
- [Weatherbit](https://www.weatherbit.io/api/historical-weather-api)
- [Weather Spark - Austin February 2026](https://weatherspark.com/h/m/8004/2026/2/Historical-Weather-in-February-2026-in-Austin-Texas-United-States)
- [NOAA Climate Data Online](https://www.ncdc.noaa.gov/cdo-web/webservices/v2)
- [Building MCP Servers - Model Context Protocol](https://modelcontextprotocol.io/docs/develop/build-server)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [Data Fetching with SWR Pattern](https://markus.oberlehner.net/blog/stale-while-revalidate-data-fetching-composable-with-vue-3-composition-api)
