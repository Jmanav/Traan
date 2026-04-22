# Traan — Claude Code Memory

## What This Project Is
Traan is a multi-agent AI system for real-time crisis dispatch in rural India.
It converts unstructured WhatsApp signals (voice notes in Hindi/regional languages,
images, texts) into a live crisis map and autonomously dispatches NGO volunteers.
Built for Google AI Solution Challenge 2026.

## The Five Agents
- Signal Agent — ingests WhatsApp payloads, extracts via Gemini multimodal, geocodes, corroborates
- Crisis Commander — master orchestrator, Gemini reasoning loop, invokes other agents
- Triage Agent — resolves conflicting signals, detects crisis velocity, upgrades severity
- Dispatch Agent — PostGIS volunteer matching, WhatsApp task cards, autonomous confirmation loop
- Monitor Agent — heartbeat surveillance, drift detection, incident closure + report generation

## Tech Stack
- Backend: Python + FastAPI
- AI: Gemini 1.5 Pro via Vertex AI (multimodal — audio, image, text in one call)
- Database: PostgreSQL + PostGIS (all geospatial queries)
- Queue: Google Cloud Pub/Sub (decouples ingestion from processing)
- Realtime: Firebase Realtime DB (dashboard live updates)
- Maps: Google Maps Geocoding API + Routes API
- Messaging: Meta WhatsApp Cloud API (inbound webhook + outbound task cards)
- Frontend: React + TypeScript + Google Maps JS API
- Hosting: Google Cloud Run

## Key Conventions
- All agents live in /backend/agents/ — one file per agent
- All Gemini calls go through /backend/services/gemini_fusion.py only
- All PostGIS + Maps calls go through /backend/services/geo_service.py only
- All WhatsApp outbound messages go through /backend/services/whatsapp_sender.py only
- All Firebase events go through /backend/services/firebase_service.py only
- Never hardcode API keys — always use environment variables via config.py
- Every agent action must be logged to the events table with agent_name, incident_id, action, outcome

## Docs to Read Before Coding
- docs/Traan_Agentic_Workflow.md — agent roles, tools, decision logic, build guide
- docs/Traan.md — full architecture, tech stack per feature, DB schema

## Build Status
### Completed
- (update after each milestone)

### In Progress
- Milestone 1: Foundation

### Not Started
- Milestones 2–7
```
