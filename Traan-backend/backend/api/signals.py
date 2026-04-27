"""
REST API routes for signals.

GET /api/signals — 20 most recent raw field signals ordered by received_at DESC
"""

from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_session

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class SignalOut(BaseModel):
    id: str
    incidentId: str | None
    signalType: str | None
    rawText: str | None
    extractedJson: dict[str, Any] | None
    receivedAt: str | None
    telegramMessageId: str | None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

_LIST_SQL = text(
    """
    SELECT
        id::text,
        incident_id::text,
        signal_type,
        raw_content,
        extracted,
        source_phone,
        received_at
    FROM signals
    ORDER BY received_at DESC NULLS LAST
    LIMIT 20
    """
)


@router.get("/signals", response_model=list[SignalOut])
async def list_signals(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[SignalOut]:
    result = await session.execute(_LIST_SQL)
    rows = result.mappings().all()

    return [
        SignalOut(
            id=str(row["id"]),
            incidentId=row["incident_id"],
            signalType=row["signal_type"],
            rawText=row["raw_content"],
            extractedJson=dict(row["extracted"]) if row["extracted"] else None,
            receivedAt=row["received_at"].isoformat() if row["received_at"] else None,
            telegramMessageId=row["source_phone"],
        )
        for row in rows
    ]
