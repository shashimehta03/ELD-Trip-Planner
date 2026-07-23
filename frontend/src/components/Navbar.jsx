import React from "react";
import { NavLink } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import {
  IconHome, IconTrips, IconPlan, IconMap, IconClock, IconFile,
} from "./icons";

const LINKS = [
  { to: "/", label: "Home", icon: IconHome, end: true },
  { to: "/trips", label: "Trips", icon: IconTrips },
  { to: "/plan", label: "Plan", icon: IconPlan },
  { to: "/route", label: "Route", icon: IconMap },
  { to: "/hos", label: "HOS", icon: IconClock },
  { to: "/logs", label: "Logs", icon: IconFile },
];

function initials(trip) {
  const name = trip?.inputs?.log_header?.driver_name;
  if (name) {
    return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  return "TP";
}

export default function Navbar() {
  const { trip } = useTrip();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">
          <span className="brand-dots"><i /><i /><i /><i /></span>
          TripPilot <span style={{ color: "var(--mint)", marginLeft: 4 }}>AI</span>
        </div>
        <div className="nav-pills">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => "nav-pill" + (isActive ? " active" : "")}>
              <Icon /><span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="avatar">{initials(trip)}</div>
      </div>
    </nav>
  );
}
