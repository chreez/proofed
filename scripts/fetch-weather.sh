#!/usr/bin/env bash
# Fetch daily weather from Open-Meteo archive API for a given date.
# Usage: ./scripts/fetch-weather.sh 2026-04-06
# Output: JSON matching BakeWeather type shape (see src/types/recipe.ts)
#
# No API key required. Austin TX coords hardcoded (PF-193).

set -euo pipefail

DATE="${1:?Usage: fetch-weather.sh YYYY-MM-DD}"
LAT="30.2672"
LON="-97.7431"
LOCATION="Austin, TX"

# WMO weather code → human-readable condition
wmo_condition() {
  case "$1" in
    0)  echo "Clear sky" ;;
    1)  echo "Mainly clear" ;;
    2)  echo "Partly cloudy" ;;
    3)  echo "Overcast" ;;
    45|48) echo "Fog" ;;
    51|53|55) echo "Drizzle" ;;
    56|57) echo "Freezing drizzle" ;;
    61|63|65) echo "Rain" ;;
    66|67) echo "Freezing rain" ;;
    71|73|75) echo "Snow" ;;
    77) echo "Snow grains" ;;
    80|81|82) echo "Rain showers" ;;
    85|86) echo "Snow showers" ;;
    95) echo "Thunderstorm" ;;
    96|99) echo "Thunderstorm with hail" ;;
    *)  echo "Unknown" ;;
  esac
}

RAW=$(curl -sf "https://archive-api.open-meteo.com/v1/archive?\
latitude=${LAT}&longitude=${LON}\
&start_date=${DATE}&end_date=${DATE}\
&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,weather_code\
&temperature_unit=fahrenheit\
&timezone=America/Chicago")

if [ -z "$RAW" ]; then
  echo '{"error":"Open-Meteo request failed"}' >&2
  exit 1
fi

HIGH=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin)['daily']; print(round(d['temperature_2m_max'][0],1))")
LOW=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin)['daily']; print(round(d['temperature_2m_min'][0],1))")
HUMIDITY=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin)['daily']; print(int(d['relative_humidity_2m_mean'][0]))")
WMO_CODE=$(echo "$RAW" | python3 -c "import sys,json; d=json.load(sys.stdin)['daily']; print(int(d['weather_code'][0]))")
CONDITION=$(wmo_condition "$WMO_CODE")

cat <<EOF
{
  "location": "${LOCATION}",
  "date": "${DATE}",
  "temp_high_f": ${HIGH},
  "temp_low_f": ${LOW},
  "humidity_avg_percent": ${HUMIDITY},
  "condition": "${CONDITION}",
  "source": "open-meteo"
}
EOF
