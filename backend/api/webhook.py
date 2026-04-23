import logging

from fastapi import APIRouter, Request, Response, Header
from fastapi.responses import JSONResponse

import backend.config as config
from backend.agents import signal_agent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> Response:
    # Validate Telegram webhook secret — return 403 on mismatch.
    # Always return 200 on internal errors to prevent Telegram retry floods.
    expected_secret = config.get_telegram_webhook_secret()
    if x_telegram_bot_api_secret_token != expected_secret:
        return JSONResponse(status_code=403, content={"ok": False, "error": "forbidden"})

    try:
        update = await request.json()
    except Exception:
        return JSONResponse(content={"ok": True})

    # Deferred import avoids circular dependency: webhook → main → webhook.
    # AsyncSessionLocal is None until lifespan sets it; resolved at call time.
    from backend import main as _main  # noqa: PLC0415

    if _main.AsyncSessionLocal is None:
        logger.error("AsyncSessionLocal not initialised — server still starting up")
        return JSONResponse(content={"ok": True})

    try:
        async with _main.AsyncSessionLocal() as session:
            result = await signal_agent.run(update, session)
            logger.info("Signal processed: %s", result)
    except Exception as exc:
        logger.error("Signal agent failed for update %s: %s", update.get("update_id"), exc)

    return JSONResponse(content={"ok": True})
