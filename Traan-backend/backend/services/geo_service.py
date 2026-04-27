import asyncio
import logging
import re
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

import backend.config as config

logger = logging.getLogger(__name__)

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_NOMINATIM_HEADERS = {"User-Agent": "Traan-Crisis-App/1.0"}
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


_NOISE_WORDS = re.compile(r"\b(village|district|tehsil|taluka|taluk|mandal|block)\b", re.IGNORECASE)


def _clean(q: str) -> str:
    """Strip noise words and collapse extra whitespace/commas."""
    q = _NOISE_WORDS.sub("", q)
    q = re.sub(r",\s*,", ",", q)       # collapse double commas
    q = re.sub(r"\s{2,}", " ", q)      # collapse spaces
    return q.strip(", ")


def _build_fallback_queries(location_string: str) -> list[tuple[str, str]]:
    """Return (query, description) tuples for progressive Nominatim fallback."""
    seen: set[str] = set()
    queries: list[tuple[str, str]] = []

    def add(q: str, label: str) -> None:
        q = q.strip()
        if q and q.lower() not in seen:
            seen.add(q.lower())
            queries.append((q, label))

    cleaned = _clean(location_string)

    # Attempt 1: full cleaned string
    add(cleaned, "cleaned")

    # Split into tokens for structured fallbacks (ignore "India" tokens)
    parts = [p for p in (_clean(t) for t in location_string.split(",")) if p and p.lower() != "india"]

    # Attempt 2: last two comma-separated tokens (most specific known geography)
    if len(parts) >= 2:
        add(", ".join(parts[-2:]), "last-two-parts")
    elif len(parts) == 1 and parts[0].lower() != cleaned.lower():
        add(parts[0], "single-part")

    # Attempt 3: last single token (state/district alone)
    if len(parts) >= 2:
        add(parts[-1], "last-part")

    # Attempt 4: "near X" anchor, or each remaining token individually
    near_match = re.search(r"\bnear\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)", location_string, re.IGNORECASE)
    if near_match:
        add(near_match.group(1).strip(), "near-anchor")
    else:
        for i, part in enumerate(parts):
            add(part, f"token-{i + 1}")

    return queries


async def geocode_location(location_string: str) -> dict | None:
    queries = _build_fallback_queries(location_string)

    try:
        async with httpx.AsyncClient(timeout=10.0, headers=_NOMINATIM_HEADERS) as client:
            for attempt, (query, label) in enumerate(queries, start=1):
                if attempt > 1:
                    await asyncio.sleep(1)  # Nominatim rate limit: 1 req/sec

                resp = await client.get(
                    _NOMINATIM_URL,
                    params={"q": query, "countrycodes": "in", "format": "json", "limit": 1},
                )
                resp.raise_for_status()
                results = resp.json()

                if results:
                    hit = results[0]
                    logger.info(
                        "Geocode OK attempt %d/%d [%s] query='%s' → %s",
                        attempt, len(queries), label, query, hit.get("display_name", ""),
                    )
                    return {"lat": float(hit["lat"]), "lng": float(hit["lon"]),
                            "formatted_address": hit.get("display_name", "")}

                logger.warning(
                    "Geocode attempt %d/%d [%s] no results query='%s'",
                    attempt, len(queries), label, query,
                )

        logger.error("Geocode exhausted all %d attempts for: '%s'", len(queries), location_string)
        return None
    except Exception as exc:
        logger.error("Geocode error for '%s': %s", location_string, exc)
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