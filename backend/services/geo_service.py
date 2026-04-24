import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

import backend.config as config

logger = logging.getLogger(__name__)

_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
_CORROBORATION_RADIUS_KM = 2.0
_CORROBORATION_WINDOW_HOURS = 2.0

_NEARBY_SQL = text("""
    SELECT id, affected_count, severity_score, signal_count
    FROM incidents
    WHERE status = 'active'
      AND coordinates IS NOT NULL
      AND ST_DWithin(
          coordinates::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius_meters
      )
      AND created_at >= :since_time
    ORDER BY
      coordinates::geography <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
    LIMIT 1
""")


async def geocode_location(location_string: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                _GEOCODE_URL,
                params={
                    "address": location_string,
                    "key": config.get_google_maps_api_key(),
                    "region": "in",
                    "language": "en",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("results"):
            logger.warning("Geocode returned no results for: %s", location_string)
            return None

        loc = data["results"][0]["geometry"]["location"]
        return {
            "lat": loc["lat"],
            "lng": loc["lng"],
            "formatted_address": data["results"][0].get("formatted_address", ""),
        }
    except Exception as exc:
        logger.error("Geocode failed for '%s': %s", location_string, exc)
        return None


async def query_nearby_incidents(
    lat: float,
    lng: float,
    session: AsyncSession,
    radius_km: float = _CORROBORATION_RADIUS_KM,
    time_window_hours: float = _CORROBORATION_WINDOW_HOURS,
) -> list[dict]:
    # Spatial indexes idx_incidents_coordinates and idx_volunteers_location
    # created in migration 0001 — required for ST_DWithin performance.
    since_time = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
    result = await session.execute(
        _NEARBY_SQL,
        {
            "lat": lat,
            "lng": lng,
            "radius_meters": radius_km * 1000,
            "since_time": since_time,
        },
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]
