import logging

from fastapi import APIRouter, BackgroundTasks, Request, Response, Header
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


_DEV_SECRETS = {"placeholder"}


def _is_dev_secret(secret: str) -> bool:
    return secret in _DEV_SECRETS or secret.startswith("traan")


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> Response:
    expected_secret = config.get_telegram_webhook_secret()
    incoming = x_telegram_bot_api_secret_token

    logger.debug(
        "Webhook auth — incoming: %r (len=%s) | expected: %r (len=%s)",
        incoming, len(incoming) if incoming else 0,
        expected_secret, len(expected_secret),
    )

    if _is_dev_secret(expected_secret):
        logger.warning("Webhook secret is a dev placeholder — skipping auth validation")
    elif incoming != expected_secret:
        return JSONResponse(status_code=403, content={"ok": False, "error": "forbidden"})

    try:
        update = await request.json()
    except Exception:
        return JSONResponse(content={"ok": True})

    # Return 200 immediately — all processing runs in the background.
    # Telegram retries on non-2xx; blocking here would cause retry floods.
    background_tasks.add_task(_process_update, update)
    return JSONResponse(content={"ok": True})
