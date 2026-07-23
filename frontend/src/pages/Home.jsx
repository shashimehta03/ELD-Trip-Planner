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

function Wheel({ cx, cy, r = 17 }) {
  return (
    <g className="tp-wheel">
      {/* modern low-profile alloy */}
      <circle cx={cx} cy={cy} r={r} fill="#0b1220" stroke="#0f2033" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#1e3350" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r - 8} fill="#152740" />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={`M${cx} ${cy} L${cx - 2.4} ${cy - (r - 7)} h4.8 z`}
          fill="#38bdf8" opacity="0.85"
          transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r="3.2" fill="#7dd3fc" />
    </g>
  );
}

function City({ dx = 0 }) {
  const bars = [10, 60, 105, 150, 205, 260, 300, 350, 400];
  return (
    <g transform={`translate(${dx} 0)`}>
      {bars.map((x, i) => (
        <rect key={i} x={x} y={120 - (i % 4) * 16} width="38"
          height={130 + (i % 4) * 16} rx="6" fill="#12263f" opacity="0.7" />
      ))}
    </g>
  );
}

function TruckArt() {
  return (
    <svg className="tp-scene" viewBox="0 0 460 300" role="img"
      aria-label="Animated electric semi truck carrying a load">
      <defs>
        <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f4fb" />
          <stop offset="52%" stopColor="#9fb8cc" />
          <stop offset="100%" stopColor="#54708a" />
        </linearGradient>
        <linearGradient id="trailer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbe7f1" />
          <stop offset="55%" stopColor="#9caec1" />
          <stop offset="100%" stopColor="#5c7288" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3a52" />
          <stop offset="100%" stopColor="#0a1826" />
        </linearGradient>
        <radialGradient id="under" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
        <clipPath id="scene"><rect x="0" y="0" width="460" height="300" /></clipPath>
      </defs>

      <g clipPath="url(#scene)">
        {/* Parallax city */}
        <g className="tp-city"><City dx={0} /><City dx={460} /></g>

        {/* Ground + neon horizon line */}
        <rect x="0" y="252" width="460" height="48" fill="#0a1526" />
        <rect x="0" y="251" width="460" height="2" fill="#1f4c6b" opacity="0.9" />

        {/* Moving lane dashes */}
        <g className="tp-road">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={-40 + i * 40} y="286" width="22" height="4" rx="2"
              fill="#2b4a63" />
          ))}
        </g>

        {/* Speed streaks behind the truck */}
        <g>
          {[190, 205, 222].map((y, i) => (
            <rect key={y} className="tp-streak" x="70" y={y} width="60" height="3"
              rx="1.5" fill="#38bdf8" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </g>

        {/* Neon underglow */}
        <ellipse className="tp-glow" cx="250" cy="250" rx="150" ry="18"
          fill="url(#under)" filter="url(#soft)" />

        {/* Truck */}
        <g className="tp-truck">
          {/* Trailer body (glossy) */}
          <rect x="96" y="150" width="212" height="92" rx="14" fill="url(#trailer)" />
          <rect x="104" y="158" width="196" height="10" rx="5" fill="#ffffff" opacity="0.5" />
          {/* accent light strip */}
          <rect className="tp-lightbar" x="104" y="226" width="196" height="4" rx="2" fill="#38bdf8" />
          {/* brand mark on the load */}
          <g opacity="0.92">
            <circle cx="150" cy="196" r="17" fill="#0e7490" />
            <path d="M143 196 h14 M150 189 v14" stroke="#e8f4fb" strokeWidth="3" strokeLinecap="round" />
          </g>
          <text x="188" y="202" fontSize="17" fontWeight="800" fill="#33506b"
            fontFamily="Inter, sans-serif" letterSpacing="0.5">CARGO</text>

          {/* Aerodynamic cab */}
          <path d="M308 242 V172 q0 -14 14 -16 l30 -4 q10 -1 16 8 l24 34 q4 6 4 14 v34 z"
            fill="url(#cab)" />
          {/* wraparound windshield */}
          <path d="M356 156 q9 -1 15 7 l20 30 h-34 q-6 0 -6 -6 V162 q0 -5 5 -6 z"
            fill="url(#glass)" />
          <path d="M357 158 l14 4 l16 26" fill="none" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.6" />
          {/* lower skirt */}
          <rect x="308" y="232" width="94" height="10" rx="3" fill="#243b52" />
          {/* headlight bar */}
          <rect className="tp-headlight" x="396" y="210" width="8" height="14" rx="3" fill="#e0f2fe" />
          <path className="tp-headlight" d="M404 210 l30 -8 v30 l-30 -6 z" fill="#bae6fd" opacity="0.3" />

          {/* Wheels */}
          <Wheel cx="150" cy="244" />
          <Wheel cx="214" cy="244" />
          <Wheel cx="286" cy="244" />
          <Wheel cx="366" cy="244" />
        </g>
      </g>
    </svg>
  );
}
