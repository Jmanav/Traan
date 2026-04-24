# Plan: Milestone 2 — Signal Agent (Telegram)

## Context
Milestone 1 (Foundation) is complete: FastAPI app, all 6 SQLAlchemy models, Alembic migration 0001, and config.py are in place. No agent logic, no API routes, no service files exist yet.

Milestone 2 builds the complete ingest-to-incident pipeline:
Telegram update → media download → Gemini extraction → geocode → PostGIS corroboration → create or strengthen incident → acknowledge reporter.

The project recently switched from WhatsApp to Telegram. `skills/telegram-messages.md` does not yet exist (created during this milestone if needed). `SPEC.md` still references Meta/WhatsApp in places — ignore those; Telegram is the correct target.

---

## 1. Answers to the Four Questions

### 1. Files to create and why

| # | File | Status | Why |
|---|---|---|---|
| 1 | `requirements.txt` | **Modify** | Add `google-generativeai==0.7.2` and `httpx==0.27.0` — nothing else can be built without these |
| 2 | `backend/config.py` | **Modify** | Add `get_telegram_webhook_secret()` — new env var needed for webhook auth |
| 3 | `.env` + `.env.example` | **Modify** | Add `TELEGRAM_WEBHOOK_SECRET=placeholder` |
| 4 | `backend/services/gemini_fusion.py` | **Create** | Single gateway for all Gemini calls per hard rules. Exposes `gemini_multimodal_extract(payload)` |
| 5 | `backend/services/geo_service.py` | **Create** | All PostGIS + Maps calls per hard rules. Exposes `geocode_location()` and `query_nearby_incidents()` |
| 6 | `backend/services/telegram_sender.py` | **Create** | All outbound Telegram messages per hard rules. Exposes `send_acknowledgement()` for now |
| 7 | `backend/agents/signal_agent.py` | **Create** | Orchestrates the full pipeline. Exposes `run(update, session)` |
| 8 | `backend/api/webhook.py` | **Create** | `POST /webhook` router — validates secret token, opens DB session, calls signal_agent.run() |
| 9 | `backend/main.py` | **Modify** | Register webhook router via `app.include_router()` |

Directories to create: `backend/api/`, `backend/agents/`, `backend/services/` — each needs an `__init__.py`.

### 2. What could go wrong

**Blocking the event loop (highest risk).**
`google-generativeai`'s `generate_content()` is synchronous. Calling it directly in an `async def` function blocks the entire FastAPI event loop for the duration of the Gemini call (~2–5s). Fix: wrap in `await asyncio.get_event_loop().run_in_executor(None, model.generate_content, parts)`.

**Circular import between main.py and webhook.py.**
`webhook.py` needs `AsyncSessionLocal` from `main.py`. `main.py` needs to import the router from `webhook.py`. Fix: in the webhook handler body, use a deferred import — `from backend import main as _main` inside the function, not at the top of the file, so `_main.AsyncSessionLocal` is resolved at call time (when it's already set by `lifespan`), not at import time.

**Telegram retry flood.**
If the webhook returns anything other than HTTP 200, Telegram retries the same update repeatedly — causing duplicate signals and DB writes. Fix: catch all exceptions in the webhook handler, log them, and always return `{"ok": True}` with 200.

**Geocode failure silently breaking the pipeline.**
If `geocode_location()` returns `None` (untranslatable rural place names are common in India), the pipeline must not abort. Fix: skip the corroboration check, go straight to `create_incident()` with `coordinates = NULL`, log the failure in `events`.

**Partial DB writes on error.**
A crash between writing the `Signal` row and the `Incident` row would leave a dangling FK. Fix: the `async with session.begin():` block in `signal_agent.py` wraps both writes — if either fails, the transaction rolls back atomically.

**PostGIS INTERVAL parameter binding.**
Using raw SQL `INTERVAL` with bound parameters is fragile across SQLAlchemy versions. Fix: compute the cutoff timestamp in Python — `datetime.now(timezone.utc) - timedelta(hours=2)` — and pass it as a bound `TIMESTAMP` param. Compare `created_at >= :since_time` instead.

**Gemini returning markdown fences or empty response.**
Gemini intermittently wraps JSON in ```json ... ``` even when instructed not to, and occasionally returns a safety-blocked empty response. Fix: always strip fences before `json.loads()`; handle empty `response.text` with a try/except that logs and re-raises.

**`source_phone` field in Signal model.**
The `Signal` model has `source_phone VARCHAR(15)`. Telegram identifies senders by `chat_id` (an integer), not a phone number. Store `str(message["from"]["id"])` in `source_phone` — it fits the field and lets us reply later.

### 3. Dependencies and ordering

```
requirements.txt (install first)
    ↓
config.py + .env (add TELEGRAM_WEBHOOK_SECRET)
    ↓
backend/services/gemini_fusion.py   ← no internal deps beyond config + installed package
backend/services/geo_service.py     ← no internal deps beyond config + httpx + DB session
backend/services/telegram_sender.py ← no internal deps beyond config + httpx + Event model
    ↓ (all three services done)
backend/agents/signal_agent.py      ← imports all three services + models
    ↓
backend/api/webhook.py              ← imports signal_agent
    ↓
backend/main.py (add include_router) ← imports webhook router
```

The three service files have no dependency on each other and can be written in any order (or in parallel).

### 4. Decisions made before building

**Q1 — Severity scorer location. DECIDED: inline in signal_agent.py.**
`_calculate_severity_score()` stays private inside `signal_agent.py` for Milestone 2. Move to `backend/services/severity_scorer.py` when Crisis Commander needs it in Milestone 4.

**Q2 — Webhook registration. DECIDED: manual curl.**
No startup-event code. Run `setWebhook` manually once during deployment. No `PUBLIC_URL` env var needed for Milestone 2.

**Q3 — Test strategy. DECIDED: text-only payloads.**
Test via curl with a plain text message payload (no `file_id`). Audio/image code paths are exercised once a real bot token is available. No fixture files committed.

---

## 2. Implementation Details

### Gemini prompt (in gemini_fusion.py)

System/context text part:
```
You are a crisis signal extraction system for disaster response in rural India.
Analyze the following signal from a field worker and extract structured data.
The signal may be a voice note in Hindi or a regional Indian language, a damage photograph, or a text message.

Extract and return ONLY a JSON object with these exact keys:
- location_raw: string — the place name or description as stated by the reporter
- affected_count: integer — number of people affected (use 0 if unknown)
- need_types: array of strings — from: ["evacuation", "medical", "food", "shelter", "rescue", "water"]
- vulnerable_groups: array of strings — from: ["elderly", "children", "pregnant", "disabled"]
- access_constraints: string — road blockages or access barriers mentioned (empty string if none)
- urgency_signals: array of strings — words or phrases indicating urgency
- confidence: float between 0 and 1 — your confidence in this extraction

Return ONLY the JSON object. No explanation, markdown, or code fences.
```

Post-processing: `response.text.strip().replace("```json","").replace("```","").strip()` → `json.loads()`.

### Severity scoring (inline in signal_agent.py for M2)

| Factor | Points |
|---|---|
| affected_count 1–9 | +10 |
| affected_count 10–49 | +20 |
| affected_count 50–99 | +35 |
| affected_count 100+ | +50 |
| Any vulnerable group | +15 |
| 2+ vulnerable groups | +20 (replaces +15) |
| need_types includes rescue or medical | +15 |
| need_types includes evacuation | +10 |
| access_constraints non-empty | +10 |
| 1–2 urgency_signals | +5 |
| 3+ urgency_signals | +10 |
| confidence < 0.4 | −10 |

Clamped to [0, 100]. Tier: ≥75 → critical, ≥45 → urgent, <45 → moderate.

### PostGIS corroboration query

```sql
SELECT id, affected_count, severity_score, signal_count
FROM incidents
WHERE status = 'active'
  AND coordinates IS NOT NULL
  AND ST_DWithin(
      coordinates::geography,
      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
      :radius_meters
  )
  AND created_at >= :since_time
ORDER BY coordinates::geography <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
LIMIT 1
```

`:since_time` = `datetime.now(timezone.utc) - timedelta(hours=2)` (avoids INTERVAL syntax issues).

### Telegram media download flow

```
GET api.telegram.org/bot{TOKEN}/getFile?file_id={file_id}
  → response.result.file_path
GET api.telegram.org/file/bot{TOKEN}/{file_path}
  → raw bytes
```

`source_phone` in Signal table → store `str(message["from"]["id"])` (Telegram chat_id).

### Webhook security

Header: `X-Telegram-Bot-Api-Secret-Token` must match `TELEGRAM_WEBHOOK_SECRET`.
Return 403 if mismatch. Otherwise always return HTTP 200 (even on internal errors — prevents Telegram retry flood).

---

## 3. Critical Files

**Modified:**
- `requirements.txt` — added google-generativeai, httpx
- `backend/config.py` — added get_telegram_webhook_secret()
- `backend/main.py` — added include_router(webhook_router)
- `.env` / `.env.example` — added TELEGRAM_WEBHOOK_SECRET

**Created:**
- `backend/services/gemini_fusion.py`
- `backend/services/geo_service.py`
- `backend/services/telegram_sender.py`
- `backend/agents/signal_agent.py`
- `backend/api/webhook.py`

---

## 4. Verification

**End-to-end test (milestone success criterion):**
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>" \
  -d '{
    "update_id": 1000001,
    "message": {
      "message_id": 1,
      "from": {"id": 7654321, "first_name": "Ravi"},
      "chat": {"id": 7654321},
      "text": "flood in Kareli village near Nashik, 60 people trapped, road blocked"
    }
  }'
```

Expected: HTTP 200 `{"ok": true}`. Then in psql:
```sql
SELECT id, location_raw, tier, severity_score, coordinates IS NOT NULL as geocoded
FROM incidents ORDER BY created_at DESC LIMIT 1;
```
Should show one row with a populated `tier`, non-null `coordinates`, and a `severity_score` > 0.

Also verify events table:
```sql
SELECT agent_name, action, outcome FROM events ORDER BY logged_at DESC LIMIT 3;
```
Should show `signal` agent with `incident_created` action.

**Secondary tests:**
- POST the same payload twice → `signal_count = 2` on the same incident row (corroboration working)
- POST with a location Geocoding cannot resolve → incident created with `coordinates = NULL`, no crash
- POST with wrong secret token → HTTP 403 returned
