import base64
import json
import logging
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import backend.config as config
from backend.services import gemini_fusion, geo_service, telegram_sender

logger = logging.getLogger(__name__)

_TELEGRAM_GET_FILE_URL = "https://api.telegram.org/bot{token}/getFile"
_TELEGRAM_FILE_URL = "https://api.telegram.org/file/bot{token}/{file_path}"


# ---------------------------------------------------------------------------
# Media download
# ---------------------------------------------------------------------------

async def _download_media(file_id: str) -> tuple[bytes, str]:
    token = config.get_telegram_bot_token()
    async with httpx.AsyncClient(timeout=30.0) as client:
        info = await client.get(
            _TELEGRAM_GET_FILE_URL.format(token=token),
            params={"file_id": file_id},
        )
        info.raise_for_status()
        file_path = info.json()["result"]["file_path"]

        download = await client.get(_TELEGRAM_FILE_URL.format(token=token, file_path=file_path))
        download.raise_for_status()

    mime_type = "audio/ogg" if file_path.endswith(".oga") or "voice" in file_path else "image/jpeg"
    return download.content, mime_type


# ---------------------------------------------------------------------------
# Payload construction
# ---------------------------------------------------------------------------

def _build_gemini_payload(message: dict, media_bytes: bytes | None, mime_type: str | None) -> dict:
    if message.get("voice") and media_bytes:
        return {
            "signal_type": "audio",
            "content": base64.b64encode(media_bytes).decode(),
            "mime_type": mime_type or "audio/ogg",
        }
    if message.get("photo") and media_bytes:
        return {
            "signal_type": "image",
            "content": base64.b64encode(media_bytes).decode(),
            "mime_type": mime_type or "image/jpeg",
        }
    return {
        "signal_type": "text",
        "content": message.get("text") or message.get("caption") or "",
    }


# ---------------------------------------------------------------------------
# Severity scoring
# ---------------------------------------------------------------------------

def _calculate_severity_score(extracted: dict) -> int:
    score = 0
    count = extracted.get("affected_count", 0)
    if count >= 100:
        score += 50
    elif count >= 50:
        score += 35
    elif count >= 10:
        score += 20
    elif count >= 1:
        score += 10

    vuln = extracted.get("vulnerable_groups", [])
    if len(vuln) >= 2:
        score += 20
    elif len(vuln) == 1:
        score += 15

    needs = set(extracted.get("need_types", []))
    if needs & {"rescue", "medical"}:
        score += 15
    if "evacuation" in needs:
        score += 10

    if extracted.get("access_constraints"):
        score += 10

    urgency_count = len(extracted.get("urgency_signals", []))
    if urgency_count >= 3:
        score += 10
    elif urgency_count >= 1:
        score += 5

    if extracted.get("confidence", 1.0) < 0.4:
        score -= 10

    return max(0, min(100, score))


def _calculate_tier(score: int) -> str:
    if score >= 75:
        return "critical"
    if score >= 45:
        return "urgent"
    return "moderate"


# ---------------------------------------------------------------------------
# DB operations
# ---------------------------------------------------------------------------

async def _log_event(
    session: AsyncSession,
    incident_id: str,
    action: str,
    payload: dict,
    outcome: str,
) -> None:
    await session.execute(
        text("""
            INSERT INTO events (incident_id, agent_name, action, payload, outcome)
            VALUES (:incident_id, 'signal', :action, CAST(:payload AS jsonb), :outcome)
        """),
        {
            "incident_id": incident_id,
            "action": action,
            "payload": json.dumps(payload),
            "outcome": outcome,
        },
    )


async def _create_incident(
    session: AsyncSession,
    extracted: dict,
    geo: dict | None,
    signal_type: str,
    source_id: str,
) -> str:
    severity_score = _calculate_severity_score(extracted)
    tier = _calculate_tier(severity_score)
    incident_id = str(uuid.uuid4())

    coordinates_expr = (
        f"ST_SetSRID(ST_MakePoint({geo['lng']}, {geo['lat']}), 4326)"
        if geo else "NULL"
    )

    await session.execute(
        text(f"""
            INSERT INTO incidents (
                id, location_raw, coordinates, severity_score, tier,
                need_types, vulnerable_groups, affected_count,
                access_constraints, status, signal_count
            ) VALUES (
                :id, :location_raw, {coordinates_expr}, :severity_score, :tier,
                :need_types, :vulnerable_groups, :affected_count,
                :access_constraints, 'active', 1
            )
        """),
        {
            "id": incident_id,
            "location_raw": extracted.get("location_raw", ""),
            "severity_score": severity_score,
            "tier": tier,
            "need_types": extracted.get("need_types", []),
            "vulnerable_groups": extracted.get("vulnerable_groups", []),
            "affected_count": extracted.get("affected_count", 0),
            "access_constraints": extracted.get("access_constraints", ""),
        },
    )

    await session.execute(
        text("""
            INSERT INTO signals (
                incident_id, signal_type, raw_content, extracted, source_phone, confidence
            ) VALUES (
                :incident_id, :signal_type, :raw_content, CAST(:extracted AS jsonb),
                :source_phone, :confidence
            )
        """),
        {
            "incident_id": incident_id,
            "signal_type": signal_type,
            "raw_content": extracted.get("location_raw", ""),
            "extracted": json.dumps(extracted),
            "source_phone": source_id[:15],
            "confidence": extracted.get("confidence", 0.0),
        },
    )

    await _log_event(
        session, incident_id, "incident_created",
        {"tier": tier, "severity_score": severity_score},
        f"new incident {incident_id} created with tier={tier}",
    )

    return incident_id


async def _strengthen_incident(
    session: AsyncSession,
    existing: dict,
    extracted: dict,
    signal_type: str,
    source_id: str,
) -> str:
    incident_id = str(existing["id"])
    new_count = extracted.get("affected_count", 0)
    new_severity = _calculate_severity_score(extracted)

    await session.execute(
        text("""
            UPDATE incidents SET
                signal_count = signal_count + 1,
                affected_count = GREATEST(affected_count, :new_count),
                severity_score = GREATEST(severity_score, :new_severity),
                tier = CASE
                    WHEN GREATEST(severity_score, :new_severity) >= 75 THEN 'critical'
                    WHEN GREATEST(severity_score, :new_severity) >= 45 THEN 'urgent'
                    ELSE 'moderate'
                END,
                updated_at = NOW()
            WHERE id = :incident_id
        """),
        {
            "incident_id": incident_id,
            "new_count": new_count,
            "new_severity": new_severity,
        },
    )

    await session.execute(
        text("""
            INSERT INTO signals (
                incident_id, signal_type, raw_content, extracted, source_phone, confidence
            ) VALUES (
                :incident_id, :signal_type, :raw_content, CAST(:extracted AS jsonb),
                :source_phone, :confidence
            )
        """),
        {
            "incident_id": incident_id,
            "signal_type": signal_type,
            "raw_content": extracted.get("location_raw", ""),
            "extracted": json.dumps(extracted),
            "source_phone": source_id[:15],
            "confidence": extracted.get("confidence", 0.0),
        },
    )

    await _log_event(
        session, incident_id, "incident_strengthened",
        {"new_signal_count": existing["signal_count"] + 1},
        f"strengthened existing incident {incident_id}",
    )

    return incident_id


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def run(update: dict, session: AsyncSession) -> dict:
    message = update.get("message", {})
    chat_id: int = message.get("chat", {}).get("id", 0)
    sender_id: str = str(message.get("from", {}).get("id", "unknown"))

    # Determine signal type and download media if needed
    media_bytes: bytes | None = None
    mime_type: str | None = None

    try:
        if message.get("voice"):
            file_id = message["voice"]["file_id"]
            media_bytes, mime_type = await _download_media(file_id)
            signal_type = "audio"
        elif message.get("photo"):
            # Telegram sends multiple sizes; use the largest
            file_id = message["photo"][-1]["file_id"]
            media_bytes, mime_type = await _download_media(file_id)
            signal_type = "image"
        else:
            signal_type = "text"
    except Exception as exc:
        logger.error("Media download failed (sender=%s): %s", sender_id, exc)
        signal_type = "text"
        media_bytes = None

    gemini_payload = _build_gemini_payload(message, media_bytes, mime_type)

    # Gemini extraction
    try:
        extracted = await gemini_fusion.gemini_multimodal_extract(gemini_payload)
    except Exception as exc:
        logger.error("Gemini extraction failed (sender=%s): %s", sender_id, exc)
        raise

    if extracted.get("confidence", 1.0) < 0.4:
        logger.warning("Low-confidence extraction (sender=%s, confidence=%.2f)", sender_id, extracted["confidence"])

    # Geocoding (non-fatal)
    geo: dict | None = None
    if extracted.get("location_raw"):
        geo = await geo_service.geocode_location(extracted["location_raw"])
        if geo is None:
            logger.warning("Geocode failed for location_raw='%s'", extracted["location_raw"])

    # Corroboration + write (single transaction)
    async with session.begin():
        nearby: list[dict] = []
        if geo:
            nearby = await geo_service.query_nearby_incidents(geo["lat"], geo["lng"], session)

        if nearby:
            incident_id = await _strengthen_incident(session, nearby[0], extracted, signal_type, sender_id)
            is_new = False
        else:
            incident_id = await _create_incident(session, extracted, geo, signal_type, sender_id)
            is_new = True

    # Acknowledgement (non-fatal — outside transaction)
    await telegram_sender.send_acknowledgement(chat_id, incident_id, is_new)

    return {
        "incident_id": incident_id,
        "action": "created" if is_new else "strengthened",
        "confidence": extracted.get("confidence", 0.0),
    }
