"""
REST API routes for dispatches.

POST /api/dispatches — create dispatch, update incident status, notify volunteer via Telegram
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_session, log_event

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class DispatchCreate(BaseModel):
    incidentId: str
    volunteerId: str


class DispatchOut(BaseModel):
    id: str
    incidentId: str
    volunteerId: str
    status: str
    dispatchedAt: str
    confirmedAt: str | None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/dispatches", status_code=201)
async def create_dispatch(
    body: DispatchCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> JSONResponse:
    # Validate incident exists
    inc_check = await session.execute(
        text("SELECT id FROM incidents WHERE id = :id"),
        {"id": body.incidentId},
    )
    if inc_check.first() is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Validate volunteer exists and get their phone for Telegram
    vol_check = await session.execute(
        text("SELECT id, phone FROM volunteers WHERE id = :id"),
        {"id": body.volunteerId},
    )
    vol_row = vol_check.mappings().first()
    if vol_row is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    # Insert dispatch record
    dispatch_result = await session.execute(
        text(
            """
            INSERT INTO dispatches (incident_id, volunteer_id, status, dispatched_at)
            VALUES (:incident_id, :volunteer_id, 'sent', NOW())
            RETURNING id::text, status, dispatched_at, confirmed_at
            """
        ),
        {"incident_id": body.incidentId, "volunteer_id": body.volunteerId},
    )
    dispatch_row = dispatch_result.mappings().first()

    # Update incident status to dispatched
    await session.execute(
        text(
            "UPDATE incidents SET status = 'dispatched', updated_at = NOW() WHERE id = :id"
        ),
        {"id": body.incidentId},
    )

    # Log the event
    await log_event(session, body.incidentId, "dispatch_created", "ok")

    # Commit before attempting Telegram — dispatch must persist even if Telegram fails
    await session.commit()

    # Notify volunteer via Telegram (non-blocking — failure does not roll back)
    try:
        from backend.services import telegram_sender  # noqa: PLC0415

        # telegram_sender.send_acknowledgement expects (chat_id, incident_id, is_new)
        # We use the volunteer's phone as a proxy identifier for logging purposes.
        # In production, volunteers would have a telegram_chat_id column.
        # For now we log the attempt and gracefully handle missing chat_id.
        volunteer_phone = vol_row.get("phone")
        if volunteer_phone:
            # --- HACKATHON DEMO OVERRIDE ---
            # Automatically route all dispatches to the developer's phone for demo purposes
            chat_id = 1283521836

            if chat_id:
                # Fetch incident details for the notification
                inc_dets = await session.execute(
                    text("SELECT location_raw, need_types FROM incidents WHERE id = :id"),
                    {"id": body.incidentId}
                )
                inc_det_row = inc_dets.mappings().first()
                loc = inc_det_row["location_raw"] if inc_det_row else "Unknown Location"
                needs = ", ".join(inc_det_row["need_types"]).upper() if inc_det_row and inc_det_row["need_types"] else "GENERAL ASSISTANCE"

                await telegram_sender.send_dispatch_notification(
                    chat_id=chat_id,
                    incident_id=body.incidentId,
                    location_raw=loc,
                    need_types=needs,
                )
    except Exception as exc:
        # Telegram failure must never prevent the dispatch response
        logger.error(
            "Telegram notification failed for dispatch (incident=%s, volunteer=%s): %s",
            body.incidentId,
            body.volunteerId,
            exc,
        )

    return JSONResponse(
        status_code=201,
        content=DispatchOut(
            id=str(dispatch_row["id"]),
            incidentId=body.incidentId,
            volunteerId=body.volunteerId,
            status=str(dispatch_row["status"]),
            dispatchedAt=dispatch_row["dispatched_at"].isoformat(),
            confirmedAt=(
                dispatch_row["confirmed_at"].isoformat()
                if dispatch_row["confirmed_at"]
                else None
            ),
        ).model_dump(),
    )
