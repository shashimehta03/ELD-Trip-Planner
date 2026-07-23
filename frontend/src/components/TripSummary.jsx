import React from "react";

export default function TripSummary({ summary, route }) {
  const stats = [
    { v: `${summary.total_miles.toLocaleString()} mi`, k: "Total distance" },
    { v: `${summary.total_drive_hours} h`, k: "Driving time" },
    { v: summary.num_days, k: summary.num_days === 1 ? "Log day" : "Log days" },
    { v: `${route.avg_mph} mph`, k: "Avg speed" },
    { v: summary.total_on_duty_hours + " h", k: "On-duty total" },
    { v: summary.fuel_stops, k: "Fuel stops" },
    { v: summary.ten_hour_resets, k: "Rest resets (10h/34h)" },
    { v: summary.thirty_min_breaks, k: "30-min breaks" },
  ];
  return (
    <div className="card">
      <h2><span className="num">2</span> Trip summary</h2>
      <div className="stats">
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="v">{s.v}</div>
            <div className="k">{s.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
