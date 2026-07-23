import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { useTrip } from "../context/TripContext";
import {
  IconRoute, IconClock, IconFuel, IconGauge, IconCalendar, IconFile, IconArrow,
} from "../components/icons";

const MINT = "#38bdf8";
const AMBER = "#f5a524";
const GREY = "#5f7398";

const axis = { stroke: "#33415c", fontSize: 12, tickLine: false };
const tooltipStyle = {
  background: "#0e182c", border: "1px solid rgba(56,189,248,0.3)",
  borderRadius: 10, color: "#eaf2ff",
};

function Stat({ icon: Icon, k, v, tone }) {
  return (
    <div className="stat">
      <div className={"stat-ico" + (tone ? " " + tone : "")}><Icon /></div>
      <div className="stat-k">{k}</div>
      <div className="stat-v">{v}</div>
    </div>
  );
}

export default function Home() {
  const { trip } = useTrip();
  const s = trip?.summary;
  const c = trip?.charts;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <span className="chip"><span className="dot" /> TripPilot AI • FMCSA 70hr/8day</span>
          <h1>HOS Route Intelligence Platform</h1>
          <p>Plan FMCSA-compliant routes, generate ELD logs, and optimize long-haul operations.</p>
          <div className="hero-cta">
            <Link to="/plan" className="btn">Plan New Trip <IconArrow size={18} /></Link>
            <Link to="/logs" className="btn btn-outline">View ELD Logs</Link>
          </div>
        </div>
        <div className="hero-art center">
          <TruckArt />
        </div>
      </section>

      {!trip ? (
        <div className="card empty" style={{ marginTop: 30 }}>
          <h3>No active trip</h3>
          <p>Plan a new trip or open an existing one from your trip history.</p>
          <div className="hero-cta center" style={{ justifyContent: "center", marginTop: 18 }}>
            <Link to="/plan" className="btn">Plan Your First Trip</Link>
            <Link to="/trips" className="btn btn-outline">View All Trips</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid stat-grid" style={{ marginTop: 26 }}>
            <Stat icon={IconRoute} k="Total Distance" v={`${s.total_miles.toLocaleString()} mi`} />
            <Stat icon={IconClock} k="Driving Time" v={`${s.total_drive_hours}h`} />
            <Stat icon={IconFuel} k="Fuel Stops" v={s.fuel_stops} tone="amber" />
            <Stat icon={IconGauge} k="Cycle Remaining" v={`${trip.hos.cycle_remaining}h`} tone="red" />
            <Stat icon={IconCalendar} k="Trip Days" v={s.num_days} />
            <Stat icon={IconFile} k="Log Sheets" v={s.num_days} />
          </div>

          <div className="grid chart-2" style={{ marginTop: 22 }}>
            <div className="card">
              <h2 className="card-h">Driving Hours by Day</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={c.driving_by_day} margin={{ left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.1)" />
                    <XAxis dataKey="date" {...axis} tickFormatter={(d) => d.slice(5)} />
                    <YAxis {...axis} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(56,189,248,0.06)" }} />
                    <Bar dataKey="hours" fill={MINT} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="card-h">Duty Status Breakdown</h2>
              <div className="chart-box center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={[
                      { name: "Driving", value: c.duty_breakdown.driving },
                      { name: "On Duty", value: c.duty_breakdown.on_duty },
                      { name: "Off Duty", value: c.duty_breakdown.off_duty },
                    ]} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                      <Cell fill={MINT} /><Cell fill={AMBER} /><Cell fill={GREY} />
                    </Pie>
                    <Legend iconType="circle" formatter={(v) => <span style={{ color: "#93a7c6" }}>{v}</span>} />
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid chart-2" style={{ marginTop: 22 }}>
            <div className="card">
              <h2 className="card-h">Cycle Usage (70h)</h2>
              <div className="chart-box center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={[
                      { name: "Used", value: c.cycle_usage.used },
                      { name: "Remaining", value: c.cycle_usage.remaining },
                    ]} innerRadius={70} outerRadius={100} startAngle={90} endAngle={-270} dataKey="value">
                      <Cell fill={MINT} /><Cell fill="rgba(56,189,248,0.12)" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="card-h">Trip Progress</h2>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={c.trip_progress} margin={{ left: -18 }}>
                    <defs>
                      <linearGradient id="tp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MINT} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={MINT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.1)" />
                    <XAxis dataKey="date" {...axis} tickFormatter={(d) => d.slice(5)} />
                    <YAxis {...axis} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="miles" stroke={MINT} fill="url(#tp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {c.fuel_stops.length > 0 && (
            <div className="card" style={{ marginTop: 22 }}>
              <h2 className="card-h">Fuel Stops</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={c.fuel_stops} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,165,36,0.12)" />
                  <XAxis dataKey="label" {...axis} />
                  <YAxis {...axis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(245,165,36,0.06)" }} />
                  <Bar dataKey="mile" fill={AMBER} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TruckArt() {
  return (
    <svg viewBox="0 0 420 300" width="90%" style={{ maxWidth: 460 }}>
      <rect width="420" height="300" fill="none" />
      {[40, 90, 150, 210, 260, 320, 370].map((x, i) => (
        <rect key={i} x={x} y={90 - (i % 3) * 18} width="34" height={140 + (i % 3) * 18}
          fill="#12263f" opacity="0.8" />
      ))}
      <rect x="30" y="210" width="240" height="60" rx="6" fill="#0e7490" />
      <rect x="30" y="200" width="240" height="14" fill="#155e75" />
      <circle cx="80" cy="272" r="18" fill="#0f172a" stroke="#334155" strokeWidth="4" />
      <circle cx="130" cy="272" r="18" fill="#0f172a" stroke="#334155" strokeWidth="4" />
      <rect x="285" y="150" width="120" height="120" rx="8" fill="#e2e8f0" />
      <rect x="295" y="162" width="100" height="10" rx="3" fill="#94a3b8" />
      <rect x="295" y="182" width="70" height="8" rx="3" fill="#cbd5e1" />
      <rect x="295" y="198" width="90" height="8" rx="3" fill="#cbd5e1" />
      <circle cx="360" cy="235" r="20" fill="#0e7490" />
      <rect x="352" y="225" width="16" height="22" rx="3" fill="#e2e8f0" />
    </svg>
  );
}
