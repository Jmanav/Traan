import asyncio
import json
import base64
import logging
from functools import partial

import google.generativeai as genai

import backend.config as config

logger = logging.getLogger(__name__)

_EXTRACTION_PROMPT = """You are a crisis signal extraction system for disaster response in rural India.
Analyze the following signal from a field worker and extract structured data.
The signal may be a voice note in Hindi or a regional Indian language, a damage photograph, or a text message.

Extract and return ONLY a JSON object with these exact keys:
- location_raw: string — the most specific place name possible in this format: village/town, district, state. Separate multiple locations with semicolons. Never combine city names without commas between them.
- affected_count: integer — number of people affected (use 0 if unknown)
- need_types: array of strings — from: ["evacuation", "medical", "food", "shelter", "rescue", "water"]
- vulnerable_groups: array of strings — from: ["elderly", "children", "pregnant", "disabled"]
- access_constraints: string — road blockages or access barriers mentioned (empty string if none)
- urgency_signals: array of strings — words or phrases indicating urgency
- confidence: float between 0 and 1 — your confidence in this extraction

Return ONLY the JSON object. No explanation, markdown, or code fences."""

_REQUIRED_KEYS = {
    "location_raw", "affected_count", "need_types",
    "vulnerable_groups", "access_constraints", "urgency_signals", "confidence",
}

_model: genai.GenerativeModel | None = None


def _get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        genai.configure(api_key=config.get_gemini_api_key(), transport="rest")
        _model = genai.GenerativeModel("gemini-2.5-flash")
    return _model


def _build_parts(payload: dict) -> list:
    parts: list = [_EXTRACTION_PROMPT]
    signal_type = payload.get("signal_type", "text")

    if signal_type in ("audio", "image"):
        content = payload["content"]
        raw_bytes = base64.b64decode(content) if isinstance(content, str) else content
        mime_type = payload.get("mime_type", "audio/ogg" if signal_type == "audio" else "image/jpeg")
        parts.append({"mime_type": mime_type, "data": base64.b64encode(raw_bytes).decode()})
    else:
        parts.append(f"Signal text: {payload.get('content', '')}")

    return parts


def _parse_response(raw_text: str) -> dict:
    cleaned = raw_text.strip().replace("```json", "").replace("```", "").strip()
    parsed = json.loads(cleaned)

    missing = _REQUIRED_KEYS - set(parsed.keys())
    if missing:
        raise ValueError(f"Gemini extraction missing required fields: {missing}")

    parsed["affected_count"] = int(parsed.get("affected_count") or 0)
    parsed["confidence"] = max(0.0, min(1.0, float(parsed.get("confidence", 0.0))))
    parsed["need_types"] = parsed.get("need_types") or []
    parsed["vulnerable_groups"] = parsed.get("vulnerable_groups") or []
    parsed["urgency_signals"] = parsed.get("urgency_signals") or []
    parsed["access_constraints"] = parsed.get("access_constraints") or ""

    return parsed


async def gemini_multimodal_extract(payload: dict) -> dict:
    model = _get_model()
    parts = _build_parts(payload)

    loop = asyncio.get_event_loop()
    try:
        response = await loop.run_in_executor(
            None, partial(model.generate_content, parts)
        )
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise

    if not response.text:
        raise ValueError("Gemini returned an empty response (likely safety-blocked)")

    try:
        return _parse_response(response.text)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Gemini response parse failed: %s | raw: %s", exc, response.text[:500])
        raise
