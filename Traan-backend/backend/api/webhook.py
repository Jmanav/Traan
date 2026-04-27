import hmac
import logging

from fastapi import APIRouter, BackgroundTasks, Request, Response
from fastapi.responses import JSONResponse

import backend.config as config
from backend.agents import signal_agent

logger = logging.getLogger(__name__)

router = APIRouter()


async def _process_update(update: dict) -> None:
    # Deferred import avoids circular dependency: webhook → main → webhook.
    # AsyncSessionLocal is None until lifespan sets it; resolved at call time.
    from backend import main as _main  # noqa: PLC0415

    if _main.AsyncSessionLocal is None:
        logger.error("AsyncSessionLocal not initialised — server still starting up")
        return

    try:
        async with _main.AsyncSessionLocal() as session:
            result = await signal_agent.run(update, session)
            logger.info("Signal processed: %s", result)
    except Exception as exc:
        logger.error("Signal agent failed for update %s: %s", update.get("update_id"), exc)


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
) -> Response:
    incoming = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    expected = config.get_telegram_webhook_secret()

    if not hmac.compare_digest(incoming, expected):
        return JSONResponse({"ok": False, "error": "forbidden"}, status_code=403)

    try:
        update = await request.json()
    except Exception:
        return JSONResponse(content={"ok": True})

    # Return 200 immediately — all processing runs in the background.
    # Telegram retries on non-2xx; blocking here would cause retry floods.
    background_tasks.add_task(_process_update, update)
    return JSONResponse(content={"ok": True})
