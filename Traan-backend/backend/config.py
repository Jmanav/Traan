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

GEMINI_API_KEY: str = _require("GEMINI_API_KEY")
# GOOGLE_MAPS_API_KEY is optional — only used for future Dispatch Agent routing (Routes API).
# Geocoding now uses Nominatim (OpenStreetMap) and does not require this key.
GOOGLE_MAPS_API_KEY: str = os.environ.get("GOOGLE_MAPS_API_KEY", "")
TELEGRAM_BOT_TOKEN: str = _require("TELEGRAM_BOT_TOKEN")
TELEGRAM_WEBHOOK_SECRET: str = _require("TELEGRAM_WEBHOOK_SECRET")
FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "*")

# Firebase and Pub/Sub are not used in the current integration — placeholders are fine.
FIREBASE_CREDENTIALS_PATH: str = os.environ.get("FIREBASE_CREDENTIALS_PATH", "placeholder")
PUBSUB_PROJECT_ID: str = os.environ.get("PUBSUB_PROJECT_ID", "placeholder")
PUBSUB_TOPIC_ID: str = os.environ.get("PUBSUB_TOPIC_ID", "placeholder")

def get_gemini_api_key() -> str:
    return GEMINI_API_KEY

def get_google_maps_api_key() -> str:
    return GOOGLE_MAPS_API_KEY

def get_telegram_bot_token() -> str:
    return TELEGRAM_BOT_TOKEN

def get_telegram_webhook_secret() -> str:
    return TELEGRAM_WEBHOOK_SECRET

def get_firebase_credentials_path() -> str:
    return FIREBASE_CREDENTIALS_PATH

def get_pubsub_project_id() -> str:
    return PUBSUB_PROJECT_ID

def get_pubsub_topic_id() -> str:
    return PUBSUB_TOPIC_ID