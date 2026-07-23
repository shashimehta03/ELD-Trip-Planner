"""
Geocoding + routing using free, key-less APIs:
  * Nominatim (OpenStreetMap)  -> address -> lat/lon
  * OSRM public server         -> driving route geometry, distance, duration

Both are free for light use. A short in-process cache and a descriptive
User-Agent keep us within Nominatim's usage policy.
"""

import math
import time
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
HEADERS = {"User-Agent": "ELD-Trip-Planner/1.0 (assessment project)"}

_geocode_cache = {}


class GeoError(Exception):
    pass


def geocode(query):
    """Return {'lat', 'lon', 'name'} for a free-text location."""
    key = query.strip().lower()
    if key in _geocode_cache:
        return _geocode_cache[key]
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1},
            headers=HEADERS, timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise GeoError(f"Geocoding failed for '{query}': {exc}")
    if not data:
        raise GeoError(f"Could not find location: '{query}'")
    hit = data[0]
    result = {
        "lat": float(hit["lat"]),
        "lon": float(hit["lon"]),
        "name": hit.get("display_name", query),
    }
    _geocode_cache[key] = result
    time.sleep(1)  # be polite to Nominatim (max 1 req/sec)
    return result


def route(points):
    """
    points: list of {'lat','lon'} in order.
    Returns {'geometry': [[lat,lon],...], 'distance_miles', 'duration_hours',
             'legs': [{'distance_miles','duration_hours'}, ...]}.
    """
    coords = ";".join(f"{p['lon']},{p['lat']}" for p in points)
    url = f"{OSRM_URL}/{coords}"
    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson",
                    "steps": "false"},
            headers=HEADERS, timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise GeoError(f"Routing failed: {exc}")
    if data.get("code") != "Ok" or not data.get("routes"):
        raise GeoError("No route found between the given locations.")

    r = data["routes"][0]
    geometry = [[lat, lon] for lon, lat in r["geometry"]["coordinates"]]
    legs = [{
        "distance_miles": leg["distance"] / 1609.34,
        "duration_hours": leg["duration"] / 3600.0,
    } for leg in r["legs"]]
    return {
        "geometry": geometry,
        "distance_miles": r["distance"] / 1609.34,
        "duration_hours": r["duration"] / 3600.0,
        "legs": legs,
    }


def _haversine_miles(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * \
        math.sin(dlon / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))


def cumulative_miles(geometry):
    """Cumulative mileage at each vertex of the route geometry."""
    cum = [0.0]
    for i in range(1, len(geometry)):
        cum.append(cum[-1] + _haversine_miles(geometry[i - 1], geometry[i]))
    return cum


def point_at_mile(geometry, cum, target_mile):
    """Interpolate the [lat,lon] point that lies `target_mile` along the route."""
    if not geometry:
        return None
    total = cum[-1]
    if total <= 0:
        return geometry[0]
    target = max(0.0, min(target_mile, total))
    for i in range(1, len(cum)):
        if cum[i] >= target:
            span = cum[i] - cum[i - 1] or 1e-9
            f = (target - cum[i - 1]) / span
            lat = geometry[i - 1][0] + f * (geometry[i][0] - geometry[i - 1][0])
            lon = geometry[i - 1][1] + f * (geometry[i][1] - geometry[i - 1][1])
            return [lat, lon]
    return geometry[-1]
