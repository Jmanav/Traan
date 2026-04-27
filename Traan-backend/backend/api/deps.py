"""
Shared FastAPI dependencies and helpers for all API routers.

Uses the same deferred-import pattern as webhook.py to avoid circular
imports — AsyncSessionLocal is set by the lifespan in main.py and is
resolved at call time, not at import time.
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    from backend import main as _main  # noqa: PLC0415

    if _main.AsyncSessionLocal is None:
        raise RuntimeError("AsyncSessionLocal not initialised — server still starting up")

    async with _main.AsyncSessionLocal() as session:
        yield session


async def log_event(
    session: AsyncSession,
    incident_id: str | None,
    action: str,
    outcome: str,
) -> None:
    """Insert a row into the events table for audit purposes."""
    try:
        await session.execute(
            text(
                """
                INSERT INTO events (incident_id, agent_name, action, outcome)
                VALUES (:incident_id, 'api', :action, :outcome)
                """
            ),
            {
                "incident_id": incident_id,
                "action": action,
                "outcome": outcome,
            },
        )
    except Exception as exc:
        # Event logging must never crash the main operation.
        logger.error("Failed to log event (action=%s, incident=%s): %s", action, incident_id, exc)
