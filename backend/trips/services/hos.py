"""
FMCSA Hours-of-Service scheduler for a property-carrying driver on the
70-hour / 8-day cycle.

Rules modeled (per FMCSA Interstate Truck Driver's Guide to HOS, 2022):
  * 11-hour driving limit   -> max 11 h driving after 10 consecutive hours off.
  * 14-hour driving window   -> no driving after the 14th hour on duty (breaks
                                do NOT extend the window).
  * 30-minute break          -> required after 8 cumulative hours of driving;
                                satisfied by any 30 min of non-driving time.
  * 70-hour / 8-day limit    -> no driving after 70 on-duty hours in 8 days.
  * 34-hour restart          -> resets the 70-hour cycle.
  * 10-hour reset            -> restores the 11-hour and 14-hour clocks.

Assumptions (from the assessment brief):
  * Property-carrying driver, 70 hrs / 8 days, no adverse driving conditions.
  * Fueling at least once every 1,000 miles.
  * 1 hour on-duty for pickup and 1 hour on-duty for drop-off.

The scheduler is intentionally framework-free so it can be unit tested on its
own and reused from the Django view.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta

# ---- Duty statuses (match the four rows of a paper log) --------------------
OFF = "OFF"          # 1. Off duty
SB = "SB"            # 2. Sleeper berth
DRIVING = "D"        # 3. Driving
ON = "ON"            # 4. On duty (not driving)

MIN = 1
HOUR = 60 * MIN

# ---- Limits (minutes) ------------------------------------------------------
MAX_DRIVE = 11 * HOUR            # 11-hour driving limit
MAX_WINDOW = 14 * HOUR           # 14-hour on-duty window
DRIVE_BEFORE_BREAK = 8 * HOUR    # driving allowed before a 30-min break
BREAK_LEN = 30 * MIN             # required break length
CYCLE_LIMIT = 70 * HOUR          # 70-hour / 8-day on-duty limit
DAILY_RESET = 10 * HOUR          # 10 consecutive hours off resets the day
RESTART_LEN = 34 * HOUR          # 34-hour restart resets the cycle

# ---- Task constants --------------------------------------------------------
PICKUP_MIN = 1 * HOUR
DROPOFF_MIN = 1 * HOUR
FUEL_MIN = 30 * MIN              # on-duty fueling stop
FUEL_EVERY_MILES = 1000.0


@dataclass
class Segment:
    """A contiguous block of one duty status on the continuous trip timeline."""
    status: str
    start_min: int          # minutes from trip start
    end_min: int
    label: str = ""         # human note (e.g. "Drive to pickup", "Fuel stop")
    start_mile: float = 0.0 # cumulative trip miles at segment start
    end_mile: float = 0.0

    @property
    def duration(self):
        return self.end_min - self.start_min


class HosScheduler:
    def __init__(self, cycle_used_hours=0.0, avg_mph=55.0, start_dt=None):
        self.cycle_used = int(round(cycle_used_hours * HOUR))
        self.avg_mph = avg_mph if avg_mph and avg_mph > 0 else 55.0
        self.start_dt = start_dt or datetime.now().replace(
            hour=8, minute=0, second=0, microsecond=0)

        self.t = 0              # current time cursor (minutes from start)
        self.mile = 0.0         # cumulative miles driven
        self.drive_today = 0    # driving minutes since last 10-h reset
        self.window_start = 0   # start of the current 14-h window
        self.since_break = 0    # driving minutes since last qualifying break
        self.next_fuel = FUEL_EVERY_MILES
        self.segments = []

    # -- low level ----------------------------------------------------------
    def _add(self, status, dur, label="", miles=0.0):
        if dur <= 0:
            return
        seg = Segment(status, self.t, self.t + dur, label,
                      self.mile, self.mile + miles)
        self.segments.append(seg)
        self.t += dur
        self.mile += miles
        # Any 30+ min of non-driving satisfies the break requirement.
        if status != DRIVING and dur >= BREAK_LEN:
            self.since_break = 0
        if status in (OFF, SB):
            # Off-duty / sleeper does not add to the on-duty cycle.
            pass
        else:
            self.cycle_used += dur

    def _take_10h_reset(self):
        self._add(OFF, DAILY_RESET, "10-hour reset (sleeper/off duty)")
        self.drive_today = 0
        self.since_break = 0
        self.window_start = self.t

    def _take_34h_restart(self):
        self._add(OFF, RESTART_LEN, "34-hour restart")
        self.cycle_used = 0
        self.drive_today = 0
        self.since_break = 0
        self.window_start = self.t

    def _take_break(self):
        self._add(OFF, BREAK_LEN, "30-minute break")
        self.since_break = 0

    # -- public tasks -------------------------------------------------------
    def drive(self, miles, label="Driving"):
        """Drive `miles`, inserting any required rests along the way."""
        remaining = miles
        while remaining > 1e-6:
            window_elapsed = self.t - self.window_start

            if self.cycle_used >= CYCLE_LIMIT:
                self._take_34h_restart()
                continue
            if self.drive_today >= MAX_DRIVE or window_elapsed >= MAX_WINDOW:
                self._take_10h_reset()
                continue
            if self.since_break >= DRIVE_BEFORE_BREAK:
                self._take_break()
                continue

            # Minutes of driving still permitted before some limit is hit.
            allow = min(
                MAX_DRIVE - self.drive_today,
                MAX_WINDOW - window_elapsed,
                DRIVE_BEFORE_BREAK - self.since_break,
                CYCLE_LIMIT - self.cycle_used,
            )
            if allow <= 0:
                # A limit was reached exactly; loop will insert the reset.
                continue

            # Miles we could cover in `allow` minutes, or before next fuel stop.
            miles_by_time = (allow / HOUR) * self.avg_mph
            miles_to_fuel = self.next_fuel - self.mile
            chunk_miles = min(remaining, miles_by_time, miles_to_fuel)
            chunk_min = int(round((chunk_miles / self.avg_mph) * HOUR))
            chunk_min = max(chunk_min, 1) if chunk_miles > 1e-6 else 0
            if chunk_min == 0:
                break

            self._add(DRIVING, chunk_min, label, miles=chunk_miles)
            self.drive_today += chunk_min
            self.since_break += chunk_min
            remaining -= chunk_miles

            # Fuel stop when we reach a 1,000-mile boundary and still driving.
            if self.mile + 1e-6 >= self.next_fuel and remaining > 1e-6:
                self.on_duty(FUEL_MIN, "Fuel stop")
                self.next_fuel += FUEL_EVERY_MILES

    def on_duty(self, dur, label="On duty"):
        """On-duty (not driving) work such as pickup, drop-off, fueling."""
        remaining = dur
        while remaining > 0:
            if self.cycle_used >= CYCLE_LIMIT:
                self._take_34h_restart()
                continue
            self._add(ON, remaining, label)
            remaining = 0


# ---------------------------------------------------------------------------
# Splitting the continuous timeline into calendar-day log sheets
# ---------------------------------------------------------------------------
STATUS_ROW = {OFF: 1, SB: 2, DRIVING: 3, ON: 4}
STATUS_NAME = {OFF: "Off Duty", SB: "Sleeper Berth", DRIVING: "Driving",
               ON: "On Duty (not driving)"}


def build_daily_logs(segments, start_dt):
    """Slice segments at midnight boundaries into per-day log sheets."""
    days = {}
    for seg in segments:
        abs_start = start_dt + timedelta(minutes=seg.start_min)
        abs_end = start_dt + timedelta(minutes=seg.end_min)
        cursor = abs_start
        while cursor < abs_end:
            day_key = cursor.date()
            midnight_next = datetime.combine(
                day_key, datetime.min.time()) + timedelta(days=1)
            piece_end = min(abs_end, midnight_next)
            day = days.setdefault(day_key, [])
            start_of_day = datetime.combine(day_key, datetime.min.time())
            day.append({
                "status": seg.status,
                "row": STATUS_ROW[seg.status],
                "start": int((cursor - start_of_day).total_seconds() // 60),
                "end": int((piece_end - start_of_day).total_seconds() // 60),
                "label": seg.label,
            })
            cursor = piece_end

    logs = []
    for i, day_key in enumerate(sorted(days.keys()), start=1):
        segs = sorted(days[day_key], key=lambda s: s["start"])
        # Fill any gaps (including before the first and after the last
        # segment) with off-duty time so every log covers a full 24 hours.
        segs = _fill_day(segs)
        totals = {OFF: 0, SB: 0, DRIVING: 0, ON: 0}
        remarks = []
        prev_status = None
        for s in segs:
            totals[s["status"]] += s["end"] - s["start"]
            if s["label"] and s["status"] != prev_status:
                remarks.append({
                    "minute": s["start"],
                    "time": _fmt(s["start"]),
                    "text": s["label"],
                })
            prev_status = s["status"]
        logs.append({
            "day": i,
            "date": day_key.isoformat(),
            "segments": segs,
            "totals_min": totals,
            "totals_hours": {k: round(v / HOUR, 2) for k, v in totals.items()},
            "remarks": remarks,
        })
    return logs


def _fill_day(segs, day_min=24 * HOUR):
    """Fill gaps before/between/after segments with off-duty to span 24 h."""
    filled = []
    cursor = 0
    for s in segs:
        if s["start"] > cursor:
            filled.append({"status": OFF, "row": STATUS_ROW[OFF],
                           "start": cursor, "end": s["start"], "label": ""})
        filled.append(s)
        cursor = max(cursor, s["end"])
    if cursor < day_min:
        filled.append({"status": OFF, "row": STATUS_ROW[OFF],
                       "start": cursor, "end": day_min, "label": ""})
    return filled


def _fmt(minutes):
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def summarize(segments, total_miles, start_dt):
    total_min = segments[-1].end_min if segments else 0
    drive_min = sum(s.duration for s in segments if s.status == DRIVING)
    on_min = sum(s.duration for s in segments if s.status == ON)
    off_min = sum(s.duration for s in segments if s.status in (OFF, SB))
    fuel_stops = sum(1 for s in segments if s.label == "Fuel stop")
    resets = sum(1 for s in segments
                 if "reset" in s.label or "restart" in s.label)
    breaks = sum(1 for s in segments if s.label == "30-minute break")
    return {
        "total_miles": round(total_miles, 1),
        "total_drive_hours": round(drive_min / HOUR, 2),
        "total_on_duty_hours": round((drive_min + on_min) / HOUR, 2),
        "total_off_hours": round(off_min / HOUR, 2),
        "total_elapsed_hours": round(total_min / HOUR, 2),
        "num_days": len(build_daily_logs(segments, start_dt)),
        "fuel_stops": fuel_stops,
        "ten_hour_resets": resets,
        "thirty_min_breaks": breaks,
    }
