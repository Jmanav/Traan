# Traan — Claude Code Memory

## What This Project Is
Traan is a multi-agent AI system for real-time crisis dispatch in rural India.
Converts unstructured Telegram signals (voice notes in Hindi/regional languages,
images, texts) into a live crisis map and autonomously dispatches NGO volunteers.
Built for Google AI Solution Challenge 2026.

## Docs Location
- docs/Traan.md — project overview, agents summary, users, SDG
- docs/Traan_Architecture.md — tech stack per feature, DB schema, env vars
- docs/Traan_Agentic_Workflow.md — agent roles, tools, decision logic, build flow
- specs/SPEC.md — what to build, success criteria, what is out of scope

## Skills Location (always follow these)
- skills/gemini-calls.md — all Gemini API call conventions
- skills/postgis-queries.md — all PostGIS/geo query conventions
- skills/telegram-messages.md — all outbound Telegram message conventions

## Tech Stack
- Backend: Python + FastAPI
- AI: Gemini 2.5 Flash via Gemini API (google-generativeai SDK) — NOT Vertex AI
- Database: PostgreSQL + PostGIS
- Queue: Google Cloud Pub/Sub
- Geocoding: OpenStreetMap Nominatim API (free, no API key required)
- Maps (routing only): Google Maps Routes API — used in Dispatch Agent only
- Messaging: Telegram Bot API
- Frontend: Next.js 14 + TypeScript + Google Maps JS API + Deck.gl
- Hosting: Google Cloud Run

## Hard Rules — Never Break These
- AI model: use google-generativeai SDK with GEMINI_API_KEY — never Vertex AI
- All Gemini calls go through backend/services/gemini_fusion.py only
- All PostGIS queries go through backend/services/geo_service.py only
- Geocoding uses Nominatim (OSM) in geo_service.py — NOT Google Maps Geocoding API
- Google Maps API key is only used for Routes API in the Dispatch Agent
- All Telegram outbound messages go through backend/services/telegram_sender.py only
- Never hardcode any API key — always load from environment via backend/config.py
- Every agent action must log to the events table with agent_name, incident_id, action, outcome
- No Firebase anywhere in this project

## Project Structure
backend/
  api/        — webhook.py, incidents.py, volunteers.py, dispatch.py, signals.py
  agents/     — signal_agent.py, crisis_commander.py, triage_agent.py,
                dispatch_agent.py, monitor_agent.py
  services/   — gemini_fusion.py, geo_service.py, telegram_sender.py,
                severity_scorer.py
  models/     — incident.py, volunteer.py, signal.py, dispatch.py, event.py
  workers/    — pubsub_consumer.py, monitor_scheduler.py
  config.py   — all env var loading

## Local Dev Setup
- PostgreSQL 15 + PostGIS installed locally on Windows
- Database: `traan`, user: `postgres`, host: `localhost:5432`
- Python venv: `venv\Scripts\Activate.ps1`
- Start server: `uvicorn backend.main:app --reload`
- Run migrations: `alembic upgrade head`
- Full setup guide: `setup.md` in project root

## Build Status
### Completed
- Milestone 1: Foundation (DB schema, models, FastAPI skeleton, local dev setup)
- Milestone 2: Signal Agent

### In Progress
- Milestone 3: Triage Agent

### Not Started
- Milestone 4: Crisis Commander
- Milestone 5: Dispatch Agent
- Milestone 6: Monitor Agent
- Milestone 7: Pub/Sub wiring
- Milestone 8: REST API endpoints + frontend wiring
