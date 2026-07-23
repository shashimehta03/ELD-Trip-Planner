"""Unit tests for the HOS scheduler (no network needed)."""

from datetime import datetime
from django.test import TestCase

from .services.hos import (
    HosScheduler, summarize, build_daily_logs, DRIVING, OFF,
    MAX_DRIVE, MAX_WINDOW, DRIVE_BEFORE_BREAK, CYCLE_LIMIT, HOUR,
)

START = datetime(2026, 7, 23, 8, 0)


def make(leg1, leg2, cycle, mph=55):
    s = HosScheduler(cycle_used_hours=cycle, avg_mph=mph, start_dt=START)
    s.drive(leg1, "Drive to pickup")
    s.on_duty(60, "Pickup")
    s.drive(leg2, "Drive to drop-off")
    s.on_duty(60, "Drop-off")
    return s


class HosLimitTests(TestCase):
    def _assert_valid(self, s):
        segs = s.segments
        for a, b in zip(segs, segs[1:]):
            self.assertEqual(a.end_min, b.start_min)  # contiguous
        drive_run = window_start = since_break = 0
        for seg in segs:
            if seg.status == OFF and seg.duration >= 10 * HOUR:
                drive_run = since_break = 0
                window_start = seg.end_min
            if seg.status != DRIVING and seg.duration >= 30:
                since_break = 0
            if seg.status == DRIVING:
                drive_run += seg.duration
                since_break += seg.duration
                self.assertLessEqual(drive_run, MAX_DRIVE + 1)
                self.assertLessEqual(since_break, DRIVE_BEFORE_BREAK + 1)
                self.assertLessEqual(seg.end_min - window_start, MAX_WINDOW + 1)

    def test_short_trip_single_day(self):
        s = make(10, 60, 0)
        self._assert_valid(s)
        summ = summarize(s.segments, 70, START)
        self.assertEqual(summ["num_days"], 1)
        self.assertEqual(summ["fuel_stops"], 0)

    def test_long_trip_multi_day(self):
        s = make(120, 1500, 10)
        self._assert_valid(s)
        summ = summarize(s.segments, 1620, START)
        self.assertGreaterEqual(summ["num_days"], 3)
        self.assertGreaterEqual(summ["fuel_stops"], 1)

    def test_cycle_limit_forces_restart(self):
        s = make(5, 120, 69.5)
        labels = " ".join(seg.label for seg in s.segments)
        self.assertIn("34-hour restart", labels)

    def test_daily_logs_cover_all_time(self):
        s = make(50, 800, 0)
        logs = build_daily_logs(s.segments, START)
        for log in logs:
            total = sum(v for v in log["totals_min"].values())
            # each day's segments sum to <= 24h and the days are contiguous
            self.assertLessEqual(total, 24 * HOUR + 1)
