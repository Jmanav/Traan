import logging

import httpx

import backend.config as config

logger = logging.getLogger(__name__)

_SEND_MESSAGE_URL = "https://api.telegram.org/bot{token}/sendMessage"


async def send_acknowledgement(chat_id: int, incident_id: str, is_new: bool) -> None:
    short_id = str(incident_id)[:8]
    if is_new:
        text = (
            f"Signal received. A new incident has been registered (ID: {short_id}). "
            "Help is being coordinated."
        )
    else:
        text = (
            "Signal received. This matches an existing incident. "
            "Your report has been added."
        )

    token = config.get_telegram_bot_token()
    url = _SEND_MESSAGE_URL.format(token=token)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text})
            resp.raise_for_status()
    except Exception as exc:
        # A failed acknowledgement must never crash the pipeline — log and continue.
        logger.error("Failed to send Telegram acknowledgement to %s: %s", chat_id, exc)

async def send_dispatch_notification(chat_id: int, incident_id: str, location_raw: str, need_types: str) -> None:
    short_id = str(incident_id)[:4].upper()
    text = (
        f"🚨 EMERGENCY DISPATCH (SIG-{short_id}) 🚨\n\n"
        f"📍 Location: {location_raw}\n"
        f"⚠️ Requirements: {need_types}\n\n"
        "You have been assigned to this crisis. Please proceed to the location immediately and report status upon arrival."
    )
    token = config.get_telegram_bot_token()
    url = _SEND_MESSAGE_URL.format(token=token)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text})
            resp.raise_for_status()
    except Exception as exc:
        logger.error("Failed to send Telegram dispatch to %s: %s", chat_id, exc)
