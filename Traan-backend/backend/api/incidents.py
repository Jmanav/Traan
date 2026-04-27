"""
REST API routes for incidents.

GET  /api/incidents          — list all, ordered by severity_score DESC
GET  /api/incidents/{id}     — single incident by UUID
PATCH /api/incidents/{id}    — update status field
"""

from __future__ import annotations

import logging
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_session, log_event

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class CoordinatesOut(BaseModel):
    lat: float
    lng: float


class IncidentOut(BaseModel):
    id: str
    locationRaw: str | None
    coordinates: CoordinatesOut | None
    severityScore: int | None
    tier: str | None
    needTypes: list[str]
    vulnerableGroups: list[str]
    affectedCount: int | None
    accessConstraints: str | None
    status: str | None
    signalCount: int | None
    createdAt: str | None
    updatedAt: str | None


class IncidentPatch(BaseModel):
    status: Literal["active", "dispatched", "resolved"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_LIST_SQL = text(
    """
    SELECT
        id::text,
        location_raw,
        ST_Y(coordinates)  AS lat,
        ST_X(coordinates)  AS lng,
        severity_score,
        tier,
        COALESCE(need_types, ARRAY[]::text[])        AS need_types,
        COALESCE(vulnerable_groups, ARRAY[]::text[]) AS vulnerable_groups,
        affected_count,
        access_constraints,
        status,
        signal_count,
        created_at,
        updated_at
    FROM incidents
    ORDER BY severity_score DESC NULLS LAST
    """
)

_GET_SQL = text(
    """
    SELECT
        id::text,
        location_raw,
        ST_Y(coordinates)  AS lat,
        ST_X(coordinates)  AS lng,
        severity_score,
        tier,
        COALESCE(need_types, ARRAY[]::text[])        AS need_types,
        COALESCE(vulnerable_groups, ARRAY[]::text[]) AS vulnerable_groups,
        affected_count,
        access_constraints,
        status,
        signal_count,
        created_at,
        updated_at
    FROM incidents
    WHERE id = :incident_id
    """
)


def _row_to_out(row: dict) -> IncidentOut:
    coords: CoordinatesOut | None = None
    if row["lat"] is not None and row["lng"] is not None:
        coords = CoordinatesOut(lat=row["lat"], lng=row["lng"])

    return IncidentOut(
        id=str(row["id"]),
        locationRaw=row["location_raw"],
        coordinates=coords,
        severityScore=row["severity_score"],
        tier=row["tier"],
        needTypes=list(row["need_types"] or []),
        vulnerableGroups=list(row["vulnerable_groups"] or []),
        affectedCount=row["affected_count"],
        accessConstraints=row["access_constraints"],
        status=row["status"],
        signalCount=row["signal_count"],
        createdAt=row["created_at"].isoformat() if row["created_at"] else None,
        updatedAt=row["updated_at"].isoformat() if row["updated_at"] else None,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/incidents", response_model=list[IncidentOut])
async def list_incidents(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[IncidentOut]:
    result = await session.execute(_LIST_SQL)
    rows = result.mappings().all()
    return [_row_to_out(dict(r)) for r in rows]


@router.get("/incidents/{incident_id}", response_model=IncidentOut)
async def get_incident(
    incident_id: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> IncidentOut:
    result = await session.execute(_GET_SQL, {"incident_id": incident_id})
    row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return _row_to_out(dict(row))


@router.patch("/incidents/{incident_id}", response_model=IncidentOut)
async def patch_incident(
    incident_id: str,
    body: IncidentPatch,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> IncidentOut:
    # Verify the incident exists first
    check = await session.execute(_GET_SQL, {"incident_id": incident_id})
    if check.mappings().first() is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    await session.execute(
        text(
            "UPDATE incidents SET status = :status, updated_at = NOW() WHERE id = :id"
        ),
        {"status": body.status, "id": incident_id},
    )
    await log_event(session, incident_id, f"status_updated_to_{body.status}", "ok")
    await session.commit()

    # Re-fetch the updated row
    result = await session.execute(_GET_SQL, {"incident_id": incident_id})
    row = result.mappings().first()
    return _row_to_out(dict(row))  # type: ignore[arg-type]
