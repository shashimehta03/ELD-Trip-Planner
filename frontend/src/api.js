const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function planTrip(payload) {
  const res = await fetch(`${BASE}/api/plan/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to plan trip. Check your inputs.");
  }
  return data;
}
