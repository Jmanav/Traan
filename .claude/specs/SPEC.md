# Traan — Build Spec

## Goal
Build the agentic backend for Traan. The system must autonomously:
1. Receive Telegram webhook payloads (audio, image, text)
2. Extract structured crisis intelligence via Gemini multimodal
3. Store incidents in PostgreSQL with PostGIS geospatial columns
4. Reason over the situation via the Crisis Commander
5. Dispatch volunteers via Telegram task cards with approach routes
6. Monitor active deployments and replan without human input

## In Scope — Build This
- Signal Agent: webhook receiver, Gemini extraction, geocoding, corroboration
- Crisis Commander: Gemini reasoning loop, agent orchestration
- Triage Agent: conflict resolution, velocity detection, severity upgrade
- Dispatch Agent: PostGIS matching, task card delivery, confirmation loop with fallback
- Monitor Agent: heartbeat scheduler, drift detection, closure + report trigger
- FastAPI webhook endpoint for Telegram Bot API payload receipt
- PostgreSQL schema with PostGIS (incidents, signals, volunteers, dispatches, events, ngos)
- Firebase event firing on every incident state change
- Google Maps Geocoding integration in geo_service.py
- Google Maps Routes API integration in geo_service.py

## Out of Scope — Do Not Build Yet
- React frontend dashboard
- NDRF escalation API integration
- Auto-generated PDF incident report
- IVR phone fallback for feature phones
- Multi-tenancy / NGO onboarding flow

## Success Criteria
- A Hindi voice note POSTed to /webhook produces a structured incident in the DB within 15 seconds
- Dispatch Agent sends a Telegram task card without human intervention
- If volunteer is unresponsive for 8 minutes, system auto-dispatches next candidate
- All agent actions are logged to the events table with structured payload
- Crisis Commander reasoning output is readable in the events log

## Required Environment Variables 
are in .env file

---

## Milestone 2 — Signal Agent

**Branch:** `feature/milestone-2-signal-agent`  
**Status:** Code-complete. Prerequisites met. Ready to test.

### Files Created

| File | Description |
|---|---|
| `backend/api/webhook.py` | FastAPI router for `POST /webhook` — validates secret token header, opens DB session, delegates to signal_agent |
| `backend/agents/signal_agent.py` | Pipeline orchestrator: media download → Gemini extraction → geocode → PostGIS corroboration → create or strengthen incident → acknowledge reporter |
| `backend/services/gemini_fusion.py` | Single gateway for all Gemini API calls — `gemini_multimodal_extract(payload)` wrapping sync SDK in `run_in_executor` |
| `backend/services/geo_service.py` | `geocode_location()` via Google Maps + `query_nearby_incidents()` via PostGIS `ST_DWithin` |
| `backend/services/telegram_sender.py` | `send_acknowledgement()` — non-fatal outbound message back to the field reporter |
| `backend/services/__init__.py` | Package marker |
| `backend/agents/__init__.py` | Package marker |
| `backend/api/__init__.py` | Package marker |

### Files Modified

| File | Change |
|---|---|
| `requirements.txt` | Added `google-generativeai==0.7.2`, `httpx==0.27.0` |
| `backend/config.py` | Added `get_telegram_webhook_secret()` |
| `backend/main.py` | Registered webhook router via `app.include_router()` |
| `.env` / `.env.example` | Added `TELEGRAM_WEBHOOK_SECRET` |

### Build Order

```
requirements.txt                         ← install first
    ↓
backend/config.py + .env                 ← TELEGRAM_WEBHOOK_SECRET added
    ↓
backend/services/gemini_fusion.py  ─┐
backend/services/geo_service.py    ─┤  no inter-dependency
backend/services/telegram_sender.py─┘
    ↓
backend/agents/signal_agent.py          ← imports all three services
    ↓
backend/api/webhook.py                  ← imports signal_agent
    ↓
backend/main.py                         ← registers router
```

### Success Criteria — Required Curl Tests

All four must pass before moving to Milestone 3.

**Setup:**
```powershell
.venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload
```

**Test 1 — New incident created from text signal**
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>" \
  -d '{"update_id":1,"message":{"message_id":1,"from":{"id":7654321,"first_name":"Ravi"},"chat":{"id":7654321},"text":"flood in Kareli village near Nashik, 60 people trapped including elderly, road blocked"}}'
```
Expected: HTTP 200 `{"ok":true}`
```sql
-- Must return 1 row with tier set and severity_score > 0
SELECT location_raw, tier, severity_score, coordinates IS NOT NULL AS geocoded
FROM incidents ORDER BY created_at DESC LIMIT 1;

-- Must show: signal | incident_created
SELECT agent_name, action FROM events ORDER BY logged_at DESC LIMIT 1;
```

**Test 2 — Corroboration (send Test 1 curl again within 2 hours)**
```sql
-- Must be 2, not a new row
SELECT signal_count FROM incidents ORDER BY created_at DESC LIMIT 1;

-- Must show: incident_strengthened
SELECT action FROM events ORDER BY logged_at DESC LIMIT 1;
```

**Test 3 — Wrong secret returns 403**
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: wrongvalue" \
  -d '{"update_id":2}'
```
Expected: HTTP 403

**Test 4 — Unresolvable location creates incident with NULL coordinates (no crash)**
```bash
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>" \
  -d '{"update_id":3,"message":{"message_id":2,"from":{"id":7654321,"first_name":"Ravi"},"chat":{"id":7654321},"text":"near the big mango tree by uncle Raju house, 5 people need help"}}'
```
Expected: HTTP 200. Incident row in DB with `coordinates = NULL`. Events shows `incident_created`. No server crash.

### Out of Scope for Milestone 2

- Audio and image signal paths (require a live Telegram bot token + real file_id — tested after bot is wired)
- Pub/Sub wiring (Milestone 7)
- Crisis Commander invocation after incident creation (Milestone 4)
- Firebase event firing (Milestone 8)
- Volunteer dispatch or task cards (Milestone 5)
- Any Triage Agent logic (Milestone 3) 