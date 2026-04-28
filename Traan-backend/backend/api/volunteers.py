"""
REST API routes for volunteers.

GET   /api/volunteers         — list all volunteers with dispatch_count
PATCH /api/volunteers/{id}    — update is_available
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_session
from backend.api.incidents import CoordinatesOut

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class VolunteerOut(BaseModel):
    id: str
    name: str | None
    phone: str | None
    skills: list[str]
    languages: list[str]
    coordinates: CoordinatesOut | None
    isAvailable: bool
    lastSeen: str | None
    ngoId: str | None
    dispatchCount: int
    avatarUrl: str | None


class VolunteerPatch(BaseModel):
    isAvailable: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_LIST_SQL = """
    SELECT
        v.id::text,
        v.name,
        v.phone,
        COALESCE(v.skills, ARRAY[]::text[])                AS skills,
        COALESCE(v.language_capabilities, ARRAY[]::text[]) AS language_capabilities,
        ST_Y(v.location)  AS lat,
        ST_X(v.location)  AS lng,
        v.is_available,
        v.last_seen,
        v.ngo_id::text,
        COUNT(d.id)::int  AS dispatch_count
    FROM volunteers v
    LEFT JOIN dispatches d ON d.volunteer_id = v.id
    GROUP BY v.id
"""

_GET_SQL = """
    SELECT
        v.id::text,
        v.name,
        v.phone,
        COALESCE(v.skills, ARRAY[]::text[])                AS skills,
        COALESCE(v.language_capabilities, ARRAY[]::text[]) AS language_capabilities,
        ST_Y(v.location)  AS lat,
        ST_X(v.location)  AS lng,
        v.is_available,
        v.last_seen,
        v.ngo_id::text,
        COUNT(d.id)::int  AS dispatch_count
    FROM volunteers v
    LEFT JOIN dispatches d ON d.volunteer_id = v.id
    WHERE v.id = :volunteer_id
    GROUP BY v.id
"""


def _row_to_out(row: dict) -> VolunteerOut:
    coords: CoordinatesOut | None = None
    if row["lat"] is not None and row["lng"] is not None:
        coords = CoordinatesOut(lat=row["lat"], lng=row["lng"])

    return VolunteerOut(
        id=str(row["id"]),
        name=row["name"],
        phone=row["phone"],
        skills=list(row["skills"] or []),
        languages=list(row["language_capabilities"] or []),
        coordinates=coords,
        isAvailable=bool(row["is_available"]),
        lastSeen=row["last_seen"].isoformat() if row["last_seen"] else None,
        ngoId=row["ngo_id"],
        dispatchCount=int(row["dispatch_count"] or 0),
        avatarUrl=None,  # not stored in DB — placeholder for future
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/volunteers", response_model=list[VolunteerOut])
async def list_volunteers(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[VolunteerOut]:
    result = await session.execute(text(_LIST_SQL))
    rows = result.mappings().all()
    return [_row_to_out(dict(r)) for r in rows]


@router.patch("/volunteers/{volunteer_id}", response_model=VolunteerOut)
async def patch_volunteer(
    volunteer_id: str,
    body: VolunteerPatch,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> VolunteerOut:
    # Verify volunteer exists
    check = await session.execute(text(_GET_SQL), {"volunteer_id": volunteer_id})
    if check.mappings().first() is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    await session.execute(
        text(
            "UPDATE volunteers SET is_available = :is_available WHERE id = :id"
        ),
        {"is_available": body.isAvailable, "id": volunteer_id},
    )
    await session.commit()

    # Re-fetch updated row
    result = await session.execute(text(_GET_SQL), {"volunteer_id": volunteer_id})
    row = result.mappings().first()
    return _row_to_out(dict(row))  # type: ignore[arg-type]
