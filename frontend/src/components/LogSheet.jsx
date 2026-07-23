import React from "react";

// Row order matches a paper log: Off, Sleeper, Driving, On duty.
const ROWS = [
  { key: "OFF", label: "1. Off Duty" },
  { key: "SB", label: "2. Sleeper Berth" },
  { key: "D", label: "3. Driving" },
  { key: "ON", label: "4. On Duty (not driving)" },
];
const ROW_INDEX = { OFF: 0, SB: 1, D: 2, ON: 3 };

const LABEL_W = 150;
const HOUR_W = 33;
const GRID_W = HOUR_W * 24;
const TOTAL_W = 66;
const HEAD_H = 26;
const ROW_H = 34;
const GRID_H = ROW_H * 4;
const W = LABEL_W + GRID_W + TOTAL_W;
const H = HEAD_H + GRID_H + 4;

const xAt = (min) => LABEL_W + (min / 1440) * GRID_W;
const rowCenter = (statusKey) =>
  HEAD_H + ROW_INDEX[statusKey] * ROW_H + ROW_H / 2;

const hourLabel = (h) => {
  if (h === 0 || h === 24) return "M";
  if (h === 12) return "N";
  return h > 12 ? h - 12 : h;
};

export default function LogSheet({ log }) {
  const segs = log.segments;
  const totals = log.totals_hours;

  // Build the continuous status polyline across the day.
  const path = [];
  segs.forEach((s, i) => {
    const y = rowCenter(s.status);
    const x1 = xAt(s.start);
    const x2 = xAt(s.end);
    if (i === 0) path.push(`M ${x1} ${y}`);
    else path.push(`L ${x1} ${y}`); // vertical connector at the transition
    path.push(`L ${x2} ${y}`);
  });

  return (
    <div className="svg-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`Driver daily log for ${log.date}`}
        style={{ minWidth: 760, fontFamily: "inherit" }}>
        {/* outer frame */}
        <rect x="0" y="0" width={W} height={H} fill="#fff" />

        {/* hour header numbers */}
        {Array.from({ length: 25 }).map((_, h) => (
          <text key={`hn${h}`} x={xAt(h * 60)} y={HEAD_H - 9}
            textAnchor="middle" fontSize="10" fill="#6b7688">
            {hourLabel(h)}
          </text>
        ))}
        <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={HEAD_H - 9}
          textAnchor="middle" fontSize="9" fill="#6b7688">Total</text>

        {/* row bands + labels + totals */}
        {ROWS.map((r, ri) => {
          const yTop = HEAD_H + ri * ROW_H;
          return (
            <g key={r.key}>
              <rect x={LABEL_W} y={yTop} width={GRID_W} height={ROW_H}
                fill={ri % 2 ? "#fbfcfe" : "#fff"} stroke="#e6eaf1" />
              <text x={12} y={yTop + ROW_H / 2 + 4} fontSize="11"
                fill="#1a2233" fontWeight="600">{r.label}</text>
              <line x1={LABEL_W + GRID_W} y1={yTop}
                x2={LABEL_W + GRID_W} y2={yTop + ROW_H} stroke="#c8cfdb" />
              <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={yTop + ROW_H / 2 + 4}
                textAnchor="middle" fontSize="12" fontWeight="700"
                fill="#0f2748">
                {totals[r.key].toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* 15-minute tick marks + hour grid lines */}
        {Array.from({ length: 24 * 4 + 1 }).map((_, q) => {
          const x = LABEL_W + (q / (24 * 4)) * GRID_W;
          const isHour = q % 4 === 0;
          return (
            <line key={`tk${q}`} x1={x} y1={HEAD_H} x2={x} y2={HEAD_H + GRID_H}
              stroke={isHour ? "#c8cfdb" : "#eef1f6"}
              strokeWidth={isHour ? 1 : 1} />
          );
        })}

        {/* the duty-status line */}
        <path d={path.join(" ")} fill="none" stroke="#2f6fed"
          strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

        {/* total-of-day check: sum */}
        <text x={LABEL_W + GRID_W + TOTAL_W / 2} y={HEAD_H + GRID_H + 1 + 0}
          textAnchor="middle" fontSize="1" fill="#fff">.</text>
      </svg>
    </div>
  );
}
