import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/traan",
)

def _require(var: str) -> str:
    val = os.environ.get(var)
    if not val:
        raise EnvironmentError(
            f"[Traan] Required environment variable '{var}' is missing or empty. "
            f"Check your .env file against .env.example."
        )
    return val

def get_gemini_api_key() -> str:
    return _require("GEMINI_API_KEY")

def get_google_maps_api_key() -> str:
    return _require("GOOGLE_MAPS_API_KEY")

def get_telegram_bot_token() -> str:
    return _require("TELEGRAM_BOT_TOKEN")

def get_telegram_webhook_secret() -> str:
    return _require("TELEGRAM_WEBHOOK_SECRET")

def get_firebase_credentials_path() -> str:
    return _require("FIREBASE_CREDENTIALS_PATH")

def get_pubsub_project_id() -> str:
    return _require("PUBSUB_PROJECT_ID")

def get_pubsub_topic_id() -> str:
    return _require("PUBSUB_TOPIC_ID")
