const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function jsonOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function planTrip(payload) {
  const res = await fetch(`${BASE}/api/plan/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function listTrips() {
  const res = await fetch(`${BASE}/api/trips/`);
  return jsonOrThrow(res);
}

export async function getTrip(id) {
  const res = await fetch(`${BASE}/api/trips/${id}/`);
  return jsonOrThrow(res);
}

export async function suggestCities(q, signal) {
  const res = await fetch(
    `${BASE}/api/geocode/suggest/?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  return res.json();
}
