"""
Trip planner: ties geocoding + routing + the HOS scheduler together and
produces the full payload the frontend needs (route, stops, daily logs).
"""

from datetime import datetime

from . import geo
from .hos import (
    HosScheduler, build_daily_logs, summarize, DRIVING, ON, OFF, SB,
    FUEL_MIN, PICKUP_MIN, DROPOFF_MIN,
)


def plan_trip(current, pickup, dropoff, cycle_used_hours, start_dt=None):
    start_dt = start_dt or datetime.now().replace(
        hour=8, minute=0, second=0, microsecond=0)

    # 1. Geocode the three locations.
    c = geo.geocode(current)
    p = geo.geocode(pickup)
    d = geo.geocode(dropoff)

    # 2. Route current -> pickup -> dropoff (one call, two legs).
    routed = geo.route([c, p, d])
    geometry = routed["geometry"]
    cum = geo.cumulative_miles(geometry)
    leg1_miles = routed["legs"][0]["distance_miles"]
    leg2_miles = routed["legs"][1]["distance_miles"]
    total_miles = routed["distance_miles"]
    avg_mph = (total_miles / routed["duration_hours"]
               if routed["duration_hours"] > 0 else 55.0)

    # 3. Run the HOS scheduler across the two legs + pickup/drop-off.
    sched = HosScheduler(cycle_used_hours=cycle_used_hours,
                         avg_mph=avg_mph, start_dt=start_dt)
    sched.drive(leg1_miles, "Drive to pickup")
    sched.on_duty(PICKUP_MIN, "Pickup")
    sched.drive(leg2_miles, "Drive to drop-off")
    sched.on_duty(DROPOFF_MIN, "Drop-off")
    segments = sched.segments

    # 4. Geo-locate every stop/event along the route by cumulative mileage.
    stops = [
        _stop("start", "Current location", c, 0.0, start_dt, 0),
        _stop("pickup", "Pickup", p, leg1_miles, start_dt,
              _event_minute(segments, "Pickup")),
        _stop("dropoff", "Drop-off", d, total_miles, start_dt,
              _event_minute(segments, "Drop-off")),
    ]
    for seg in segments:
        if seg.status == DRIVING:
            continue
        if seg.label in ("Pickup", "Drop-off"):
            continue
        pt = geo.point_at_mile(geometry, cum, seg.start_mile)
        kind = _classify(seg.label)
        stops.append({
            "type": kind,
            "label": seg.label,
            "lat": pt[0] if pt else None,
            "lon": pt[1] if pt else None,
            "mile": round(seg.start_mile, 1),
            "arrive_time": _clock(start_dt, seg.start_min),
            "duration_min": seg.duration,
        })
    stops.sort(key=lambda s: s["mile"])

    # 5. Daily logs + summary.
    logs = build_daily_logs(segments, start_dt)
    summary = summarize(segments, total_miles, start_dt)

    return {
        "inputs": {
            "current_location": c["name"],
            "pickup_location": p["name"],
            "dropoff_location": d["name"],
            "current_cycle_used_hours": cycle_used_hours,
        },
        "route": {
            "geometry": geometry,
            "distance_miles": round(total_miles, 1),
            "duration_hours": round(routed["duration_hours"], 2),
            "avg_mph": round(avg_mph, 1),
            "pickup_mile": round(leg1_miles, 1),
        },
        "stops": stops,
        "summary": summary,
        "logs": logs,
        "start_datetime": start_dt.isoformat(),
    }


def _stop(kind, label, geo_pt, mile, start_dt, minute):
    return {
        "type": kind,
        "label": label,
        "lat": geo_pt["lat"],
        "lon": geo_pt["lon"],
        "name": geo_pt["name"],
        "mile": round(mile, 1),
        "arrive_time": _clock(start_dt, minute),
    }


def _classify(label):
    l = label.lower()
    if "fuel" in l:
        return "fuel"
    if "34" in l or "restart" in l:
        return "restart"
    if "reset" in l:
        return "rest"
    if "break" in l:
        return "break"
    return "stop"


def _event_minute(segments, label):
    for seg in segments:
        if seg.label == label:
            return seg.start_min
    return 0


def _clock(start_dt, minute):
    from datetime import timedelta
    return (start_dt + timedelta(minutes=minute)).strftime("%Y-%m-%d %H:%M")
