# ELD Trip Planner

A full-stack app that turns trip details into a **HOS-compliant route** and
**drawn ELD daily-log sheets**. Enter a current location, pickup, drop-off, and
the cycle hours already used; the app geocodes the stops, builds the driving
route, runs an FMCSA Hours-of-Service scheduler, and renders one filled-out
log sheet per day.

- **Backend:** Django + Django REST Framework (the HOS engine + routing)
- **Frontend:** React (Vite) + React-Leaflet for the map, hand-drawn SVG log grid
- **Maps/Routing:** OpenStreetMap tiles, Nominatim geocoding, OSRM routing — all
  free and key-less

---

## What it does

**Inputs:** current location · pickup location · drop-off location · current cycle used (hrs)

**Outputs:**
1. A **map** of the full route (current → pickup → drop-off) with markers for
   the pickup, drop-off, fuel stops, 30-minute breaks, 10-hour resets and any
   34-hour restart.
2. **Daily log sheets**, one per calendar day, drawn on the classic four-row
   grid (Off Duty / Sleeper / Driving / On Duty) with the duty-status line
   traced across all 24 hours, per-row totals, and a remarks list.

### Assumptions (per the brief)
- Property-carrying driver, **70 hrs / 8 days**, no adverse driving conditions
- Fueling at least once every **1,000 miles**
- **1 hour** on duty for pickup and **1 hour** for drop-off

---

## Hours-of-Service rules modeled

The scheduler (`backend/trips/services/hos.py`) enforces the FMCSA rules for a
property-carrying driver:

| Rule | Limit |
|------|-------|
| Driving limit | 11 hours after 10 consecutive hours off |
| Driving window | No driving after the 14th on-duty hour (breaks don't extend it) |
| 30-minute break | Required after 8 cumulative hours of driving |
| 70-hour / 8-day | No driving after 70 on-duty hours in 8 days |
| 34-hour restart | Resets the 70-hour cycle |
| 10-hour reset | Restores the 11- and 14-hour clocks |

The engine walks the trip leg by leg, inserting the required breaks, 10-hour
resets, 34-hour restarts and fuel stops exactly where a limit is reached, then
slices the continuous timeline at midnight into per-day log sheets (each padded
with off-duty time so every sheet totals 24 hours).

---

## Project structure

```
eld-trip-planner/
├── backend/                 # Django + DRF
│   ├── eldproject/          # settings, urls, wsgi
│   ├── trips/
│   │   ├── services/
│   │   │   ├── hos.py       # HOS scheduler (framework-free, unit-tested)
│   │   │   ├── geo.py       # Nominatim geocoding + OSRM routing
│   │   │   └── planner.py   # orchestration -> API payload
│   │   ├── models.py        # Trip (stores each planned trip)
│   │   ├── views.py         # /api/plan/, /api/trips/, /api/health/
│   │   └── tests.py         # HOS unit tests
│   ├── requirements.txt
│   ├── Procfile / render.yaml / build.sh
└── frontend/                # React (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── TripForm.jsx
    │   │   ├── RouteMap.jsx     # Leaflet map + stop markers
    │   │   ├── LogSheet.jsx     # SVG ELD grid
    │   │   └── TripSummary.jsx
    │   ├── api.js
    │   └── App.jsx
    └── vercel.json
```

---

## Run locally

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate   |   macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver           # http://localhost:8000
```

Quick check: `GET http://localhost:8000/api/health/` → `{"status": "ok"}`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env                 # VITE_API_URL defaults to http://localhost:8000
npm run dev                          # http://localhost:5173
```

Open http://localhost:5173, click **Use example**, then **Plan trip**.

---

## API

`POST /api/plan/`

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Denver, CO",
  "current_cycle_used_hours": 10
}
```

Returns `route` (geometry, miles, avg mph), `stops` (typed, geo-located),
`summary` (miles, drive hours, days, fuel stops, resets, breaks), and `logs`
(per-day segments, totals, remarks). Each trip is also saved and retrievable at
`GET /api/trips/<id>/`.

---

## Deploy

**Frontend → Vercel:** import the repo, set root directory to `frontend`,
add env var `VITE_API_URL` = your backend URL. `vercel.json` handles the SPA
rewrite.

**Backend → Render (or Railway/Fly):** `render.yaml` and `build.sh` are
included. Point the service at `backend/`; it runs migrations, collects static
files, and serves via gunicorn + WhiteNoise. Set `CORS_ALLOWED_ORIGINS` to your
Vercel URL (or leave `CORS_ALLOW_ALL=True` for the demo).

---

## Tests

```bash
cd backend
python manage.py test trips
```

Covers the 11-hour, 14-hour, 8-hour-break and 70-hour limits, the forced
34-hour restart, and that every log sheet spans a full 24 hours.

---

## Loom walkthrough outline (3–5 min)

1. **Intro (20s)** — what the app does: trip in, route + ELD logs out.
2. **Live demo (90s)** — enter Dallas → Oklahoma City → Denver, 10 hrs used;
   show the map with fuel/rest markers and flip through the day tabs.
3. **HOS logic (60s)** — open `hos.py`, walk the `drive()` loop: how it checks
   the 11h / 14h / 8h-break / 70h limits and inserts resets and fuel stops.
4. **Log drawing (45s)** — `LogSheet.jsx`: mapping minutes → x, status → row,
   tracing the duty line, midnight splitting + 24-hour padding.
5. **Wrap (20s)** — architecture, free APIs used, deployment.
