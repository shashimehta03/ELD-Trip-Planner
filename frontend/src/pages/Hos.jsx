import React from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import Gauge from "../components/Gauge";
import Timeline from "../components/Timeline";

export default function Hos() {
  const { trip } = useTrip();
  if (!trip) return (
    <div className="page">
      <div className="card empty">
        <h3>No active trip</h3>
        <p>Plan a trip to see the HOS breakdown.</p>
        <Link to="/plan" className="btn" style={{ marginTop: 14 }}>Plan a Trip</Link>
      </div>
    </div>
  );

  const h = trip.hos;
  const cycleColor = h.cycle_remaining <= 0 ? "#f5a524" : "#38bdf8";

  return (
    <div className="page">
      <h1 className="page-title">HOS Timeline</h1>
      <p className="page-sub">Duty status breakdown and event timeline for the active trip.</p>

      <div className="grid gauge-grid">
        <Gauge value={h.window_hours} max={h.window_limit} label="14-Hour Window" desc="Duty period" />
        <Gauge value={h.drive_hours} max={h.drive_limit} label="11-Hour Drive" desc="Driving limit" />
        <Gauge value={h.cycle_hours} max={h.cycle_limit} color={cycleColor} label="70-Hour Cycle" desc="8-day rolling" />
        <Gauge value={h.cycle_remaining} max={h.cycle_limit} label="Cycle Remaining" desc="Available hours" />
      </div>

      <div className="grid info-grid" style={{ marginTop: 22 }}>
        <div className="card info-card">
          <div className="k">Current Duty Status</div>
          <div className="v">{h.current_status}</div>
          {h.current_note && <span className="pill">{h.current_note}</span>}
        </div>
        <div className="card info-card">
          <div className="k">30-Min Break</div>
          <div className="v">Required Breaks Taken</div>
          <span className="pill">{h.breaks_taken} breaks</span>
        </div>
        <div className="card info-card">
          <div className="k">Fuel Stops</div>
          <div className="v">{h.fuel_stops} Scheduled</div>
          <span className="pill">Every 1,000 mi</span>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <Timeline items={trip.timeline} title="Duty Status Timeline" />
      </div>
    </div>
  );
}
