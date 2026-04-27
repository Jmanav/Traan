import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

import backend.config as config

logger = logging.getLogger(__name__)

engine = None
AsyncSessionLocal = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, AsyncSessionLocal
    engine = create_async_engine(config.DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield
    await engine.dispose()


app = FastAPI(title="Traan Crisis Dispatch API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Existing webhook route (preserved without modification)
from backend.api.webhook import router as _webhook_router  # noqa: E402
app.include_router(_webhook_router)

# REST API routers
from backend.api.incidents import router as _incidents_router  # noqa: E402
from backend.api.volunteers import router as _volunteers_router  # noqa: E402
from backend.api.dispatches import router as _dispatches_router  # noqa: E402
from backend.api.signals import router as _signals_router  # noqa: E402

app.include_router(_incidents_router, prefix="/api")
app.include_router(_volunteers_router, prefix="/api")
app.include_router(_dispatches_router, prefix="/api")
app.include_router(_signals_router, prefix="/api")


@app.get("/ready")
async def ready():
    return {"status": "ready"}


@app.get("/health")
async def health():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        logger.exception("Health check DB query failed")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": str(exc)},
        )
