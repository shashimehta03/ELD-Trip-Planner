import React, { useState } from "react";

const EXAMPLE = {
  current_location: "Dallas, TX",
  pickup_location: "Oklahoma City, OK",
  dropoff_location: "Denver, CO",
  current_cycle_used_hours: 10,
};

export default function TripForm({ onSubmit, loading, error }) {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used_hours: "",
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      current_cycle_used_hours: parseFloat(form.current_cycle_used_hours || 0),
    });
  };

  return (
    <div className="card">
      <h2><span className="num">1</span> Trip details</h2>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Current location</label>
            <input value={form.current_location} onChange={set("current_location")}
              placeholder="e.g. Dallas, TX" required />
          </div>
          <div className="field">
            <label>Pickup location</label>
            <input value={form.pickup_location} onChange={set("pickup_location")}
              placeholder="e.g. Oklahoma City, OK" required />
          </div>
          <div className="field">
            <label>Drop-off location</label>
            <input value={form.dropoff_location} onChange={set("dropoff_location")}
              placeholder="e.g. Denver, CO" required />
          </div>
          <div className="field">
            <label>Current cycle used (hours)</label>
            <input type="number" min="0" max="70" step="0.5"
              value={form.current_cycle_used_hours}
              onChange={set("current_cycle_used_hours")}
              placeholder="0 – 70" required />
            <span className="hint">On-duty hours already used in the 70 hr / 8 day cycle.</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Planning route…" : "Plan trip & generate logs"}
          </button>
          <button type="button" onClick={() => setForm(EXAMPLE)} disabled={loading}
            style={{
              marginTop: 18, border: "1px solid var(--line)", background: "#fff",
              borderRadius: 10, padding: "12px 16px", fontSize: 14,
              cursor: "pointer", fontWeight: 600, color: "var(--muted)",
            }}>
            Use example
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
