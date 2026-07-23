"""
Trip planner: ties geocoding + routing + the HOS scheduler together and
produces the full payload the frontend needs (route, stops, timeline, charts,
HOS gauges, and drawn daily logs).
"""

from datetime import datetime, timedelta

from . import geo
from .hos import (
    HosScheduler, build_daily_logs, summarize, DRIVING, ON, OFF, SB,
    PICKUP_MIN, DROPOFF_MIN, HOUR,
)

STATUS_LABEL = {OFF: "Off duty", SB: "Sleeper berth", DRIVING: "Driving",
                ON: "On duty (not driving)"}


def plan_trip(current, pickup, dropoff, cycle_used_hours, start_dt=None,
              log_header=None):
    start_dt = start_dt or datetime.now().replace(
        hour=8, minute=0, second=0, microsecond=0)
    log_header = log_header or {}

    # 1. Geocode + route current -> pickup -> dropoff.
    c = geo.geocode(current)
    p = geo.geocode(pickup)
    d = geo.geocode(dropoff)
    routed = geo.route([c, p, d])
    geometry = routed["geometry"]
    cum = geo.cumulative_miles(geometry)
    leg1_miles = routed["legs"][0]["distance_miles"]
    leg2_miles = routed["legs"][1]["distance_miles"]
    total_miles = routed["distance_miles"]
    avg_mph = (total_miles / routed["duration_hours"]
               if routed["duration_hours"] > 0 else 55.0)

    # 2. Run the HOS scheduler.
    sched = HosScheduler(cycle_used_hours=cycle_used_hours,
                         avg_mph=avg_mph, start_dt=start_dt)
    sched.drive(leg1_miles, "Drive to pickup")
    sched.on_duty(PICKUP_MIN, "Pickup")
    sched.drive(leg2_miles, "Drive to drop-off")
    sched.on_duty(DROPOFF_MIN, "Drop-off")
    segments = sched.segments

    # 3. Geo-located stops.
    stops = [
        _stop("start", "Current location", c, 0.0, start_dt, 0),
        _stop("pickup", "Pickup", p, leg1_miles, start_dt,
              _event_minute(segments, "Pickup")),
        _stop("dropoff", "Drop-off", d, total_miles, start_dt,
              _event_minute(segments, "Drop-off")),
    ]
    for seg in segments:
        if seg.status == DRIVING or seg.label in ("Pickup", "Drop-off"):
            continue
        pt = geo.point_at_mile(geometry, cum, seg.start_mile)
        stops.append({
            "type": _classify(seg.label),
            "label": seg.label,
            "lat": pt[0] if pt else None,
            "lon": pt[1] if pt else None,
            "mile": round(seg.start_mile, 1),
            "arrive_time": _clock(start_dt, seg.start_min),
            "duration_min": seg.duration,
        })
    stops.sort(key=lambda s: s["mile"])

    # 4. Timeline of every segment (for Route + HOS pages).
    timeline = _build_timeline(segments, start_dt, c["name"], p["name"],
                               d["name"], leg1_miles)

    # 5. Daily logs, enriched with per-day miles + header.
    logs = build_daily_logs(segments, start_dt)
    miles_by_date = _miles_by_date(segments, start_dt)
    for lg in logs:
        lg["total_miles_today"] = round(miles_by_date.get(lg["date"], 0.0), 1)
        lg["header"] = log_header
    summary = summarize(segments, total_miles, start_dt)

    # 6. Charts + HOS gauges.
    charts = _build_charts(logs, segments, stops, cycle_used_hours, total_miles)
    hos = _build_hos(logs, segments, cycle_used_hours)

    return {
        "inputs": {
            "current_location": c["name"],
            "pickup_location": p["name"],
            "dropoff_location": d["name"],
            "current_cycle_used_hours": cycle_used_hours,
            "log_header": log_header,
        },
        "route": {
            "geometry": geometry,
            "distance_miles": round(total_miles, 1),
            "duration_hours": round(routed["duration_hours"], 2),
            "avg_mph": round(avg_mph, 1),
            "pickup_mile": round(leg1_miles, 1),
        },
        "stops": stops,
        "timeline": timeline,
        "summary": summary,
        "charts": charts,
        "hos": hos,
        "logs": logs,
        "start_datetime": start_dt.isoformat(),
    }


# --------------------------------------------------------------------------
def _build_timeline(segments, start_dt, cur_name, pick_name, drop_name, leg1):
    items = []
    for seg in segments:
        abs_start = start_dt + timedelta(minutes=seg.start_min)
        abs_end = start_dt + timedelta(minutes=seg.end_min)
        note = seg.label
        if seg.status == DRIVING:
            if seg.start_mile < leg1 - 1e-6:
                note = f"En route {cur_name} → {pick_name}"
            else:
                note = f"En route {pick_name} → {drop_name}"
        items.append({
            "status": seg.status,
            "status_label": STATUS_LABEL[seg.status],
            "title": _timeline_title(seg),
            "start_iso": abs_start.isoformat(),
            "end_iso": abs_end.isoformat(),
            "start_str": abs_start.strftime("%b %d, %Y, %I:%M %p"),
            "end_str": abs_end.strftime("%b %d, %Y, %I:%M %p"),
            "duration_min": seg.duration,
            "duration_str": _dur(seg.duration),
            "miles": round(seg.end_mile - seg.start_mile, 0) if seg.status == DRIVING else 0,
            "note": note,
        })
    return items


def _timeline_title(seg):
    if seg.status == DRIVING:
        return "Driving"
    if "34-hour" in seg.label:
        return "34-hour cycle restart"
    if "10-hour" in seg.label:
        return "10-hour reset"
    if "30-minute" in seg.label:
        return "30-minute break"
    if seg.label == "Fuel stop":
        return "Fuel stop"
    if seg.label in ("Pickup", "Drop-off"):
        return seg.label
    return STATUS_LABEL[seg.status]


def _build_charts(logs, segments, stops, cycle_used, total_miles):
    driving_by_day = [{"date": lg["date"], "hours": lg["totals_hours"][DRIVING]}
                      for lg in logs]
    trip_progress = [{"date": lg["date"],
                      "miles": lg["total_miles_today"]} for lg in logs]

    drive_h = sum(s.duration for s in segments if s.status == DRIVING) / HOUR
    on_h = sum(s.duration for s in segments if s.status == ON) / HOUR
    off_h = sum(s.duration for s in segments if s.status in (OFF, SB)) / HOUR

    cycle_total = cycle_used + drive_h + on_h
    fuel = [{"label": f"Stop {i+1}", "mile": s["mile"]}
            for i, s in enumerate(s2 for s2 in stops if s2["type"] == "fuel")]

    return {
        "driving_by_day": driving_by_day,
        "trip_progress": trip_progress,
        "duty_breakdown": {
            "driving": round(drive_h, 1),
            "on_duty": round(on_h, 1),
            "off_duty": round(off_h, 1),
        },
        "cycle_usage": {
            "used": round(min(cycle_total, 70), 1),
            "remaining": round(max(0.0, 70 - cycle_total), 1),
            "limit": 70,
        },
        "fuel_stops": fuel,
    }


def _build_hos(logs, segments, cycle_used):
    peak_drive = max((lg["totals_hours"][DRIVING] for lg in logs), default=0)
    peak_window = max(
        (lg["totals_hours"][DRIVING] + lg["totals_hours"][ON] for lg in logs),
        default=0)
    drive_h = sum(s.duration for s in segments if s.status == DRIVING) / HOUR
    on_h = sum(s.duration for s in segments if s.status == ON) / HOUR
    cycle_total = cycle_used + drive_h + on_h
    breaks = sum(1 for s in segments if s.label == "30-minute break")
    resets = sum(1 for s in segments if "reset" in s.label or "restart" in s.label)
    fuel = sum(1 for s in segments if s.label == "Fuel stop")
    last_on = [s for s in segments if s.status in (DRIVING, ON)]
    current_status = STATUS_LABEL[segments[-1].status] if segments else "Off duty"
    current_note = segments[-1].label if segments else ""
    return {
        "window_hours": round(min(peak_window, 14), 1),
        "window_limit": 14,
        "drive_hours": round(min(peak_drive, 11), 1),
        "drive_limit": 11,
        "cycle_hours": round(cycle_total, 1),
        "cycle_limit": 70,
        "cycle_remaining": round(max(0.0, 70 - cycle_total), 1),
        "breaks_taken": breaks,
        "resets": resets,
        "fuel_stops": fuel,
        "current_status": current_status.upper(),
        "current_note": current_note.upper(),
    }


def _miles_by_date(segments, start_dt):
    out = {}
    for seg in segments:
        if seg.status != DRIVING or seg.end_mile <= seg.start_mile:
            continue
        abs_start = start_dt + timedelta(minutes=seg.start_min)
        abs_end = start_dt + timedelta(minutes=seg.end_min)
        total_span = (abs_end - abs_start).total_seconds() or 1
        miles = seg.end_mile - seg.start_mile
        cursor = abs_start
        while cursor < abs_end:
            day_key = cursor.date().isoformat()
            midnight_next = datetime.combine(
                cursor.date(), datetime.min.time()) + timedelta(days=1)
            piece_end = min(abs_end, midnight_next)
            frac = (piece_end - cursor).total_seconds() / total_span
            out[day_key] = out.get(day_key, 0.0) + miles * frac
            cursor = piece_end
    return out


def _stop(kind, label, geo_pt, mile, start_dt, minute):
    return {
        "type": kind, "label": label,
        "lat": geo_pt["lat"], "lon": geo_pt["lon"], "name": geo_pt["name"],
        "mile": round(mile, 1), "arrive_time": _clock(start_dt, minute),
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
    return (start_dt + timedelta(minutes=minute)).strftime("%Y-%m-%d %H:%M")


def _dur(minutes):
    return f"{minutes // 60}h {minutes % 60:02d}m"
