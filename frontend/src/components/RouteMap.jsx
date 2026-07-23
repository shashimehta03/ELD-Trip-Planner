import React from "react";
import {
  MapContainer, TileLayer, Polyline, CircleMarker, Tooltip,
} from "react-leaflet";

const COLORS = {
  start: "#0f2748",
  pickup: "#1f9d55",
  dropoff: "#d64545",
  fuel: "#f5a623",
  rest: "#2f6fed",
  restart: "#8256d0",
  break: "#00a3a3",
  stop: "#6b7688",
};

const LABELS = {
  start: "Start", pickup: "Pickup", dropoff: "Drop-off", fuel: "Fuel",
  rest: "10h rest", restart: "34h restart", break: "30m break", stop: "Stop",
};

export default function RouteMap({ route, stops }) {
  const line = route.geometry;
  const center = line[Math.floor(line.length / 2)] || [39.5, -98.35];

  const bounds = line.length
    ? line.reduce(
        (b, p) => [
          [Math.min(b[0][0], p[0]), Math.min(b[0][1], p[1])],
          [Math.max(b[1][0], p[0]), Math.max(b[1][1], p[1])],
        ],
        [[line[0][0], line[0][1]], [line[0][0], line[0][1]]]
      )
    : null;

  return (
    <>
      <div className="map-wrap">
        <MapContainer
          center={center}
          bounds={bounds}
          scrollWheelZoom={true}
          style={{ height: 440 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={line} pathOptions={{ color: "#2f6fed", weight: 4 }} />
          {stops
            .filter((s) => s.lat != null && s.lon != null)
            .map((s, i) => (
              <CircleMarker
                key={i}
                center={[s.lat, s.lon]}
                radius={s.type === "start" || s.type === "pickup" || s.type === "dropoff" ? 9 : 6}
                pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor: COLORS[s.type] || "#6b7688",
                  fillOpacity: 1,
                }}
              >
                <Tooltip>
                  <b>{s.label}</b>
                  <br />
                  {s.mile != null && <>Mile {s.mile} · </>}
                  {s.arrive_time}
                </Tooltip>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
      <div className="legend">
        {Object.keys(LABELS).map((k) => (
          <div className="item" key={k}>
            <span className="dot" style={{ background: COLORS[k] }} />
            {LABELS[k]}
          </div>
        ))}
      </div>
    </>
  );
}
