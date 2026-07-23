import React, { useState } from "react";
import { planTrip } from "./api";
import TripForm from "./components/TripForm";
import TripSummary from "./components/TripSummary";
import RouteMap from "./components/RouteMap";
import LogSheet from "./components/LogSheet";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(0);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await planTrip(payload);
      setResult(data);
      setActiveDay(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const log = result?.logs[activeDay];

  return (
    <>
      <header className="app-header">
        <div className="wrap">
          <h1>ELD Trip Planner</h1>
          <p>Enter a trip and get a HOS-compliant route with drawn daily log sheets.</p>
          <div className="badge-row">
            <span className="badge">Property-carrying · 70 hr / 8 day</span>
            <span className="badge">11 h drive · 14 h window · 30 min break</span>
            <span className="badge">Fuel every 1,000 mi · 1 h pickup / drop-off</span>
          </div>
        </div>
      </header>

      <main className="container">
        <TripForm onSubmit={handleSubmit} loading={loading} error={error} />

        {result && (
          <>
            <TripSummary summary={result.summary} route={result.route} />

            <div className="card">
              <h2><span className="num">3</span> Route &amp; stops</h2>
              <RouteMap route={result.route} stops={result.stops} />
            </div>

            <div className="card">
              <h2><span className="num">4</span> Daily log sheets</h2>
              <div className="log-nav">
                {result.logs.map((l, i) => (
                  <button
                    key={i}
                    className={i === activeDay ? "active" : ""}
                    onClick={() => setActiveDay(i)}
                  >
                    Day {l.day} · {l.date}
                  </button>
                ))}
              </div>

              {log && (
                <>
                  <div className="log-meta">
                    <span>From: <b>{result.inputs.current_location.split(",")[0]}</b></span>
                    <span>To: <b>{result.inputs.dropoff_location.split(",")[0]}</b></span>
                    <span>Cycle used at start: <b>{result.inputs.current_cycle_used_hours} h</b></span>
                    <span>Driving today: <b>{log.totals_hours.D.toFixed(2)} h</b></span>
                    <span>On duty today: <b>{(log.totals_hours.D + log.totals_hours.ON).toFixed(2)} h</b></span>
                  </div>

                  <LogSheet log={log} />

                  <div className="remarks">
                    <h4>Remarks — duty status changes</h4>
                    {log.remarks.length === 0 ? (
                      <p className="footnote">Off duty the entire day.</p>
                    ) : (
                      <ul>
                        {log.remarks.map((r, i) => (
                          <li key={i}>
                            <span className="t">{r.time}</span>
                            <span>{r.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="footnote">
                    Grid drawn from the HOS schedule. Each sheet spans a full 24 hours;
                    totals on the right sum to 24.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
