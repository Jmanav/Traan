# Traan — Architecture & Tech Stack
### Per-Feature Breakdown for Agentic Build
*Reference this file when building each milestone in Claude Code*

---

## Feature 1: WhatsApp Signal Ingestion
**Milestone 1 — Foundation of the entire pipeline**

Receives voice notes, images, and texts from field workers in real time. Zero app install required on the field worker's side.

| Component | Technology | Why |
|---|---|---|
| Messaging channel | Meta WhatsApp Cloud API | Free, official, handles audio/image/text natively. 500M+ Indian users already on it. |
| Webhook receiver | FastAPI (Python) | Async, handles concurrent payloads; `POST /webhook` for messages, `GET /webhook` for Meta verification |
| Media download | Meta Graph API | Fetches audio/image bytes from WhatsApp CDN before Gemini processing |
| Message queue | Google Cloud Pub/Sub | Decouples ingestion from processing — absorbs burst traffic during a real crisis without dropping messages |

**Key files:** `backend/api/webhook.py`, `backend/workers/pubsub_consumer.py`

---

## Feature 2: Multimodal AI Extraction — Signal Agent
**Milestone 2 — The core novelty of the system**

Converts raw voice notes in Hindi/regional languages, damage photos, and texts into structured incident data in a single Gemini call. No separate STT pipeline.

| Component | Technology | Why |
|---|---|---|
| Core AI model | Gemini 1.5 Pro via Vertex AI | One model handles audio + image + text together. Native support for Hindi, Marathi, Bengali, Tamil, Assamese. |
| Audio processing | Gemini Audio (built-in) | Transcription + entity extraction in one pass — no separate Speech-to-Text step |
| Image understanding | Gemini Vision (built-in) | Damage classification, road inundation detection, landmark recognition from field photos |
| Structured output | Gemini JSON mode | Extracts: `location_raw`, `affected_count`, `need_types`, `vulnerable_groups`, `access_constraints`, `urgency_signals`, `confidence` |
| Location resolution | Google Maps Geocoding API | Converts "Kareli village, near Nashik" → `{lat, lng}` |
| Corroboration | PostGIS `ST_DWithin` | Checks for existing incident within 2km + 2hr window; merges if found |

**Key files:** `backend/agents/signal_agent.py`, `backend/services/gemini_fusion.py`, `backend/services/geo_service.py`

---

## Feature 3: Geospatial Incident Management
**Milestone 2–3 — Runs across Signal, Triage, and Dispatch agents**

All spatial storage, volunteer proximity queries, and incident clustering.

| Component | Technology | Why |
|---|---|---|
| Database | PostgreSQL | ACID-compliant, supports complex relational + spatial queries |
| Geospatial layer | PostGIS extension | Native `GEOMETRY` types, GIST spatial indexes, `ST_DWithin` radius checks — orders of magnitude faster than app-level distance math |
| Incident corroboration | `ST_DWithin(2km, 2hr)` | Merges new signals into existing incident automatically |
| Volunteer matching | PostGIS nearest-neighbor | `ORDER BY ST_Distance ASC` with skill + language filter |
| Coverage gap detection | `ST_Collect` + `ST_ConvexHull` | Identifies geographic areas with active incidents and no nearby volunteers |
| Indexes | `GIST` on `incidents.coordinates` and `volunteers.location` | Must exist before any spatial query runs |

**Key files:** `backend/services/geo_service.py`, `backend/models/`

---

## Feature 4: Crisis Commander Reasoning Loop
**Milestone 4 — The agentic brain**

Runs on every meaningful state change. Reasons over the full situational picture and decides which agent to invoke, in what order, with what parameters.

| Component | Technology | Why |
|---|---|---|
| Reasoning engine | Gemini 1.5 Pro (Vertex AI) | Large context window holds full incident state + volunteer map in one prompt. Function calling API maps to agent tool invocations. |
| Orchestration | Custom Python class | Full control over reasoning loop, tool call sequencing, retry logic, and state management |
| State persistence | PostgreSQL `events` table | Every Commander decision logged: `agent_name`, `incident_id`, `action`, `payload`, `outcome`, `timestamp` |
| Real-time sync | Firebase Realtime DB | Fires state change events to coordinator dashboard — no polling needed |
| Escalation | `escalate_to_ndrf()` tool | Flags critical incidents to national authority when volunteer coverage fails |

**Key files:** `backend/agents/crisis_commander.py`, `backend/services/firebase_service.py`

---

## Feature 5: Conflict Resolution — Triage Agent
**Milestone 3 — Resolves noisy multi-signal reality**

Multiple signals about the same crisis often contradict each other. Triage Agent synthesizes ground truth.

| Component | Technology | Why |
|---|---|---|
| Conflict resolution | Python weighted logic | Numeric fields: highest credible estimate weighted by source proximity. Boolean fields: most recent signal wins. |
| Location precision | PostGIS `ST_ConvexHull` | Creates bounding polygon when two signals place incident 2km+ apart |
| Velocity detection | Signal timestamp query | Compares signal rate in rolling windows — acceleration = spreading crisis |
| Severity upgrade | Rule engine + Gemini | Upgrades tier from `moderate` → `urgent` → `critical` based on velocity + vulnerable group presence |

**Key files:** `backend/agents/triage_agent.py`

---

## Feature 6: Volunteer Dispatch & Confirmation Loop — Dispatch Agent
**Milestone 5 — Autonomous end-to-end dispatch**

Matches volunteers, sends task cards, waits for confirmation, and re-dispatches autonomously without human intervention.

| Component | Technology | Why |
|---|---|---|
| Volunteer query | PostGIS nearest-neighbor + skill filter | Ranks by: distance + skill match + language capability + historical response rate |
| Route calculation | Google Maps Routes API | Approach route accounting for blocked roads extracted from incident signals |
| Task card delivery | Meta WhatsApp Cloud API | Same connection as ingestion. Volunteers already use WhatsApp — zero onboarding. |
| Confirmation loop | Python `asyncio` + Pub/Sub | Non-blocking 8-minute timeout — system continues processing other incidents while waiting |
| Fallback logic | Dispatch Agent re-query | Marks unresponsive, queries next candidate automatically. Continues until confirmed or coverage fails. |
| Coverage failure | `report_coverage_failure()` | Signals Crisis Commander → NDRF escalation path |

**Task card format:** Location · Role · Approach route · ETA · "Reply 1 to confirm, 2 to decline"

**Key files:** `backend/agents/dispatch_agent.py`, `backend/services/whatsapp_sender.py`

---

## Feature 7: Active Incident Monitoring — Monitor Agent
**Milestone 6 — Keeps the loop alive after dispatch**

Heartbeat every 3 minutes across all confirmed dispatches. Detects stalls, drift, and resolution.

| Component | Technology | Why |
|---|---|---|
| Scheduler | Python APScheduler | Runs Monitor Agent checks every 3 minutes — lightweight, no separate worker infra needed |
| Arrival timeout | Dispatch timestamp vs ETA | If volunteer confirmed but no "arrived" signal past ETA + buffer → check-in message fires |
| Drift detection | Signal velocity + PostGIS expansion | Accelerating signals or new pins outside original radius = spreading crisis |
| Re-dispatch trigger | Internal event → Dispatch Agent | Wakes Dispatch Agent with updated incident context |
| Incident closure | Monitor Agent + PostgreSQL | Archives signals, marks status `resolved`, triggers report |
| Post-crisis report | Auto-compiled from `events` table | All signals, dispatches, response times compiled without human input |

**Key files:** `backend/agents/monitor_agent.py`, `backend/workers/monitor_scheduler.py`

---

## Feature 8: Coordinator Dashboard
**Milestone 8 — Human visibility layer**

Live map giving NGO coordinators full situational awareness. Receives updates within 1–2 seconds of any agent action.

| Component | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript | Component model maps cleanly to incident cards, overlays, dispatch panels |
| Crisis map | Google Maps JavaScript API | Custom severity markers, geographic clustering, polygon overlays for drift zones |
| Data viz | deck.gl | Severity heatmap layer, arc layer showing volunteer-to-incident assignment lines |
| Real-time updates | Firebase Realtime DB listener | Sub-2-second map updates on every agent state change |
| Deployment | Google Cloud Run | Serverless, scales to zero, handles traffic spikes during crises |

**Key files:** `frontend/src/components/CrisisMap.tsx`, `frontend/src/hooks/useFirebaseSync.ts`

---

## Feature 9: Infrastructure
**Milestone 1 — Set up before any feature build**

| Component | Technology | Why |
|---|---|---|
| Backend hosting | Google Cloud Run | Serverless containers, free tier generous, GCP stack expected by judges |
| Local dev | Docker + docker-compose | FastAPI + PostgreSQL/PostGIS mirrors production locally |
| CI/CD | Google Cloud Build | Auto test + deploy on push to main |
| IaC | Terraform | Reproducible Pub/Sub + Cloud Run setup |
| Secrets | python-dotenv + `.env` | All API keys via environment variables — never hardcoded |
| Logging | Google Cloud Logging | Structured agent action logs with `incident_id` context |

---

## Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE ngos (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT,
    region  TEXT,
    api_key VARCHAR(64) UNIQUE
);

CREATE TABLE incidents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_raw      TEXT,
    coordinates       GEOMETRY(Point, 4326),
    severity_score    INTEGER,                        -- 0-100
    tier              VARCHAR(20),                    -- critical / urgent / moderate
    need_types        TEXT[],                         -- evacuation, medical, food, shelter, rescue
    vulnerable_groups TEXT[],                         -- elderly, children, pregnant, disabled
    affected_count    INTEGER,
    access_constraints TEXT,
    status            VARCHAR(20) DEFAULT 'active',   -- active / resolved / escalated
    signal_count      INTEGER DEFAULT 1,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE signals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id  UUID REFERENCES incidents(id),
    signal_type  VARCHAR(10),                         -- audio / image / text
    raw_content  TEXT,
    extracted    JSONB,                               -- full Gemini extraction output
    source_phone VARCHAR(15),
    confidence   FLOAT,
    received_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volunteers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT,
    phone                 VARCHAR(15) UNIQUE,
    skills                TEXT[],                     -- flood_rescue, medical, logistics
    language_capabilities TEXT[],                     -- Hindi, Marathi, Bengali
    location              GEOMETRY(Point, 4326),
    is_available          BOOLEAN DEFAULT false,
    last_seen             TIMESTAMPTZ,
    ngo_id                UUID REFERENCES ngos(id)
);

CREATE TABLE dispatches (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id    UUID REFERENCES incidents(id),
    volunteer_id   UUID REFERENCES volunteers(id),
    status         VARCHAR(20) DEFAULT 'sent',        -- sent / confirmed / arrived / complete / unresponsive
    dispatched_at  TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at   TIMESTAMPTZ,
    arrived_at     TIMESTAMPTZ,
    approach_route JSONB
);

CREATE TABLE events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    agent_name  VARCHAR(30),                          -- signal / triage / commander / dispatch / monitor
    action      TEXT,
    payload     JSONB,
    outcome     TEXT,
    logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial indexes — create before any query runs
CREATE INDEX idx_incidents_coordinates ON incidents USING GIST(coordinates);
CREATE INDEX idx_volunteers_location   ON volunteers USING GIST(location);
CREATE INDEX idx_signals_incident      ON signals(incident_id);
CREATE INDEX idx_dispatches_incident   ON dispatches(incident_id);
CREATE INDEX idx_events_incident       ON events(incident_id);
```

---

## Required Environment Variables

```
GEMINI_API_KEY
GOOGLE_MAPS_API_KEY
META_WHATSAPP_TOKEN
META_PHONE_NUMBER_ID
META_VERIFY_TOKEN
DATABASE_URL
FIREBASE_CREDENTIALS_PATH
PUBSUB_PROJECT_ID
PUBSUB_TOPIC_ID
```

---

*Traan — Architecture Reference — April 2026*
