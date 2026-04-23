from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

import backend.config as config

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

from backend.api.webhook import router as _webhook_router  # noqa: E402
app.include_router(_webhook_router)


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
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": str(exc)},
        )
