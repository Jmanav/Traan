# Traan
### AI-Powered Last-Mile Crisis Dispatch for Rural India
*Google AI Solution Challenge 2026*

---

## What It Is

Traan is a **multimodal crisis signal fusion engine** backed by a **5-agent AI system**. It converts unstructured WhatsApp messages — voice notes in Hindi/regional languages, damage photos, panicked texts — into a live crisis map and autonomously dispatches NGO volunteers. No forms. No app install. No structured data entry required from the field.

**Pitch:** *"While NGOs wait for field workers to fill forms, Traan is already reading their voice notes in Hindi, mapping the crisis, and dispatching volunteers — before the first spreadsheet is opened."*

---

## The Problem

India has ~3.3M NGOs. When a crisis hits, the first 6 hours are when coordinated response saves the most lives. This is also when all existing tools are blind — because no structured data has been entered yet. Field workers send voice notes. Coordinators drown in 340 unread WhatsApp messages. Volunteers end up at the same location while another village gets nobody.

---

## The Five Agents

| Agent | Role |
|---|---|
| **Signal Agent** | Ingests WhatsApp payload, extracts via Gemini multimodal, geocodes, corroborates with existing incidents |
| **Crisis Commander** | Master orchestrator — Gemini reasoning loop, decides which agents to invoke and when |
| **Triage Agent** | Resolves conflicting signals, detects crisis velocity, upgrades severity |
| **Dispatch Agent** | PostGIS volunteer matching, WhatsApp task cards, autonomous 8-min confirmation loop with fallback |
| **Monitor Agent** | Heartbeat surveillance every 3 min, drift detection, incident closure + auto-report |

---

## Users

| User | Interaction |
|---|---|
| Field worker | Sends WhatsApp voice/image/text — nothing else needed |
| NGO coordinator | Views live crisis map, oversees autonomous dispatch |
| Volunteer | Receives WhatsApp task card with role, route, ETA |
| SDMA (Phase 2) | API access to incident intelligence layer |

---

## Project Structure

traan/
├── CLAUDE.md                  # Claude Code memory
├── SPEC.md                    # Build spec
├── docs/
    |__Traan_Agentic_Worflow.md 
│   ├── Traan.md               # This file — project overview
│   └── Traan_Architecture.md  # Tech stack per feature + DB schema
├── skills/
│   ├── gemini-calls.md
│   ├── postgis-queries.md
│   └── whatsapp-messages.md
├── backend/
│   ├── main.py
│   ├── api/          # webhook, incidents, volunteers, dispatch
│   ├── agents/       # signal, crisis_commander, triage, dispatch, monitor
│   ├── services/     # gemini_fusion, geo_service, whatsapp_sender, firebase_service
│   ├── models/       # incident, volunteer, signal, dispatch, event
│   └── workers/      # pubsub_consumer, monitor_scheduler
├── frontend/
│   └── src/components/  # CrisisMap, IncidentCard, VolunteerOverlay, DispatchPanel
├── infra/            # cloudbuild.yaml, terraform
├── docker-compose.yml
└── .env.example

---

## Scalability

- **Phase 1 (0–6 mo):** 3 NGOs, Maharashtra + Kerala, 500 volunteers, monsoon season pilot
- **Phase 2 (6–18 mo):** Open API for State Disaster Management Authorities, 5 states, 50K volunteers
- **Phase 3 (18 mo+):** NDMA integration, expand to Bangladesh, Philippines, Indonesia

**Revenue:** SaaS to state govts + international NGOs. Field worker layer free permanently.

---

## Competitive Edge

Ushahidi maps crises manually. Zelos coordinates after tasks are entered. Nobody has connected unstructured WhatsApp chaos → autonomous dispatch. That gap only became buildable with Gemini multimodal in 2024–25.

*See `docs/Traan_Architecture.md` for full tech stack, DB schema, and build milestones.*
