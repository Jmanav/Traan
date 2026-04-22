# Traan — Agentic Workflow & Claude Code Build Guide
### Multi-Agent Crisis Intelligence System
*Google AI Solution Challenge 2026*

---

## Table of Contents
1. [Why an Agentic System?](#1-why-an-agentic-system)
2. [Agent Architecture Overview](#2-agent-architecture-overview)
3. [The Five Agents](#3-the-five-agents)
4. [Full Agentic Loop — End to End](#4-full-agentic-loop--end-to-end)
5. [State Transition Table](#5-state-transition-table)
6. [Building with Claude Code](#6-building-with-claude-code)
7. [CLAUDE.md Template](#7-claudemd-template)
8. [SPEC.md Template](#8-specmd-template)
9. [Claude Code Skills](#9-claude-code-skills)
10. [Build Order & Milestones](#10-build-order--milestones)

---

## 1. Why an Agentic System?

The pipeline architecture (signal → transcribe → extract → score → dispatch) works on the happy path. Real crises don't follow happy paths.

A flood sends 200 conflicting signals, not one clean voice note. Situations evolve mid-operation. Volunteers go unresponsive. Roads close after dispatch. A coordinator is overwhelmed and slow. A fixed pipeline cannot adapt to any of this. An agentic system can — because it **reasons, decides, and acts in loops** without waiting for a human at every step.

### Three Properties That Demand Agentic Design

**Multi-step reasoning under uncertainty**
"90 people are trapped but only 2 volunteers are nearby. Should I pull from a lower-priority incident 15km away or escalate to NDRF?" A pipeline returns an error. An agent reasons through it.

**Dynamic replanning**
The closest volunteer doesn't confirm. A new signal contradicts an earlier one. The road that was open is now flooded. An agent detects these changes and replans without human intervention.

**Tool use across systems**
Maps API, PostGIS volunteer queries, WhatsApp message delivery, Firebase state sync, incident logging — an agent orchestrates all of these, choosing which to call and when based on the current state of the crisis.

---

## 2. Agent Architecture Overview

Four specialized agents are orchestrated by a central **Crisis Commander**. Each has a defined role, a set of tools, and the ability to hand off to other agents.

```
                    ┌─────────────────────────┐
                    │     CRISIS COMMANDER    │  ← Master orchestrator
                    │     (Gemini 1.5 Pro)    │    Reasons, plans, delegates
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   SIGNAL AGENT   │  │   TRIAGE AGENT   │  │  DISPATCH AGENT  │  │  MONITOR AGENT   │
│                  │  │                  │  │                  │  │                  │
│  Ingests raw     │  │  Resolves        │  │  Matches, routes,│  │  Tracks active   │
│  WhatsApp chaos  │  │  conflicts,      │  │  confirms        │  │  incidents,      │
│  Extract, geocode│  │  detects drift   │  │  volunteers      │  │  flags stalls    │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 3. The Five Agents

### 3.1 Signal Agent

**Role:** First point of contact. Ingestion, extraction, and corroboration.

**Triggers:** Every incoming WhatsApp payload — voice note, image, or text.

**What it does:**
- Downloads media bytes from Meta's CDN
- Calls Gemini multimodal to extract structured entity from audio/image/text
- Geocodes the stated location via Maps API to lat/lng
- Queries PostGIS for an existing incident within 2km + 2 hour window
  - **Match found** → Strengthens existing incident (increments signal_count, updates affected_count if higher, re-evaluates severity)
  - **No match** → Creates new incident, fires event to Crisis Commander

**Tools:**

| Tool | Purpose |
|---|---|
| `gemini_multimodal_extract(payload)` | Transcribe + entity extract from audio/image/text in one Gemini call |
| `geocode_location(location_string)` | Convert stated location to lat/lng via Maps Geocoding API |
| `query_nearby_incidents(lat, lng, radius_km, time_window_hours)` | PostGIS corroboration check |
| `create_incident(incident_object)` | Write new incident to PostgreSQL + PostGIS |
| `strengthen_incident(incident_id, new_signal)` | Merge new signal into existing incident, recalculate severity |

**Output:** Incident object in DB + event fired to Crisis Commander.

---

### 3.2 Crisis Commander

**Role:** Master orchestrator and reasoning brain. Runs on every meaningful state change.

**Triggers:** New incident created, incident updated, volunteer responds/declines, Monitor Agent flags drift, time threshold crossed.

**What it does:**
Runs a Gemini 1.5 Pro reasoning loop with full situational context:

> *"Kareli village: severity 87, 60–70 trapped, elderly present, road blocked from Nashik. Volunteers within 30km: 4. Two already dispatched to a moderate incident in Pune. Should I reassign? What's the coverage gap? Is signal velocity accelerating? Should this go to NDRF?"*

It then decides:
- Which agents to invoke and in what order
- Whether to escalate to NDRF
- Whether to notify the human coordinator
- Whether to loop back and re-evaluate after an action

**Tools:**

| Tool | Purpose |
|---|---|
| `get_all_active_incidents()` | Full situational picture across all active crises |
| `get_volunteer_availability_map(region)` | Current volunteer status and positions |
| `calculate_coverage_gaps(incident_ids)` | Identify under-served incidents |
| `invoke_triage_agent(incident_id)` | Delegate conflict resolution |
| `invoke_dispatch_agent(incident_id, constraints)` | Delegate volunteer matching and dispatch |
| `invoke_monitor_agent(incident_id)` | Delegate active surveillance |
| `escalate_to_ndrf(incident_id, reason)` | Flag to national disaster authority |
| `notify_coordinator(message, urgency)` | Push alert to dashboard |

**Output:** Sequence of agent invocations + logged reasoning in events table.

---

### 3.3 Triage Agent

**Role:** Ground truth synthesis. Resolves conflicting signals into a single coherent incident picture.

**Triggers:** Invoked by Crisis Commander when an existing incident receives new signals.

**What it does:**

Signal 1 says 40 trapped. Signal 3 says 90. Signal 5 says road open. Signal 7 says road blocked. Triage Agent resolves this:

**Conflict resolution rules:**
- Numeric fields (affected_count): Highest credible estimate with confidence weight. On-site voice note > forwarded text.
- Boolean fields (road_accessible): Most recent signal wins, weighted by source proximity to incident.
- Location precision: If two signals are 2km apart, create bounding polygon instead of single point.

**Escalation detection:**
If signal velocity accelerates (5 signals in 10 minutes vs 1 in the first 10 minutes) → spreading crisis detected → severity auto-upgrades → Crisis Commander notified.

**Tools:**

| Tool | Purpose |
|---|---|
| `get_all_signals_for_incident(incident_id)` | Full signal history for conflict analysis |
| `resolve_numeric_conflict(field, signals)` | Weighted resolution of contradicting numbers |
| `calculate_signal_velocity(incident_id, window_minutes)` | Detect accelerating crisis spread |
| `update_incident_ground_truth(incident_id, resolved_object)` | Write resolved state to DB |
| `upgrade_severity(incident_id, reason)` | Elevate tier with logged reason |

**Output:** Updated incident ground truth + severity upgrade if warranted.

---

### 3.4 Dispatch Agent

**Role:** Volunteer matching, task card delivery, and autonomous confirmation loop.

**Triggers:** Invoked by Crisis Commander after triage completes.

**What it does:**
1. Queries PostGIS for nearest eligible volunteers ranked by: distance + skill match + language + historical response rate
2. Calculates approach route via Maps Routes API (accounting for blocked roads from incident signals)
3. Sends WhatsApp task card to top candidate
4. Enters autonomous confirmation loop — **no human intervention required:**

```
Task card sent to Volunteer A
        │
        ▼
Wait 8 minutes
        │
        ├── Confirmed ──────────────► Hand off to Monitor Agent
        │
        └── No response
                │
                ▼
        Send follow-up message → wait 5 more minutes
                │
                ├── Confirmed ──────► Hand off to Monitor Agent
                │
                └── Still no response
                        │
                        ▼
                Mark unresponsive → Re-query PostGIS → Volunteer B
                        │
                        └── All candidates exhausted?
                                │
                                ▼
                        Report coverage failure → Crisis Commander → NDRF escalation
```

**Tools:**

| Tool | Purpose |
|---|---|
| `query_eligible_volunteers(lat, lng, skills, radius_km)` | PostGIS nearest-neighbor with skill filter |
| `send_whatsapp_task_card(volunteer_id, incident_object, route)` | Formatted task card via WhatsApp API |
| `wait_for_confirmation(volunteer_id, timeout_minutes)` | Async wait with timeout |
| `mark_volunteer_unresponsive(volunteer_id)` | Update availability in DB |
| `calculate_route(origin, destination, avoid_roads)` | Maps Routes API with road avoidance |
| `report_coverage_failure(incident_id)` | Signal back to Crisis Commander |

**Output:** Confirmed volunteer assigned + approach route calculated, OR coverage failure reported.

---

### 3.5 Monitor Agent

**Role:** Active incident surveillance after dispatch confirmed. Runs on heartbeat loop every 3 minutes.

**Triggers:** Volunteer confirms dispatch. Also runs continuously on scheduler.

**What it watches for:**

**Timeout without arrival**
Volunteer confirmed 45 mins ago, ETA was 22 mins, no "arrived" update. Monitor Agent sends check-in WhatsApp. No response in 5 mins → alert coordinator + trigger re-dispatch.

**Situation drift**
New field signals show incident expanding (more people, new location pins, rising water language). Fire back to Crisis Commander to re-evaluate and dispatch additional volunteers.

**Incident closure**
Volunteer field update confirms situation resolved. Trigger post-incident documentation pipeline: compile all signals, dispatch logs, response times → auto-generate incident report.

**Tools:**

| Tool | Purpose |
|---|---|
| `get_active_dispatches()` | All confirmed dispatches currently in progress |
| `send_volunteer_checkin(volunteer_id)` | WhatsApp check-in message |
| `check_for_new_signals(incident_id, since_timestamp)` | Poll for field updates |
| `calculate_incident_drift(incident_id)` | Detect geographic or scope expansion |
| `trigger_redispatch(incident_id)` | Wake Dispatch Agent for additional volunteers |
| `trigger_incident_closure(incident_id)` | Mark resolved, archive all signals |
| `generate_incident_report(incident_id)` | Auto-compile post-crisis report |

**Output:** Ongoing surveillance logs + re-dispatch triggers + incident report on closure.

---

## 4. Full Agentic Loop — End to End

```
WhatsApp signal arrives (voice / image / text)
        │
        ▼
┌────────────────────┐
│    SIGNAL AGENT    │
│  Extract → Geocode │
│  → Corroborate     │
└─────────┬──────────┘
          │
          ├── New incident ────────────────────────────────────┐
          │                                                    ▼
          └── Existing incident                ┌──────────────────────────┐
                      │                        │      CRISIS COMMANDER    │
                      ▼                        │  Reasons over full       │
              ┌───────────────┐                │  situational picture     │
              │  TRIAGE AGENT │                └────────────┬─────────────┘
              │  Resolve       │                             │
              │  conflicts     │             ┌──────────────┼──────────────┐
              │  Detect        │             ▼              ▼              ▼
              │  velocity      │      ┌───────────┐  ┌──────────┐  ┌──────────┐
              └──────┬─────────┘      │ DISPATCH  │  │ ESCALATE │  │  NOTIFY  │
                     │                │   AGENT   │  │ TO NDRF  │  │COORDINAT-│
                     ▼                └─────┬─────┘  └──────────┘  │   OR    │
              Crisis Commander              │                        └──────────┘
              re-evaluates                  ▼
                                   Send WhatsApp task card
                                            │
                                  ┌─────────┴──────────┐
                                  ▼                    ▼
                            Confirmed            No response / Declined
                                  │                    │
                                  ▼                    ▼
                        ┌─────────────────┐    Re-query → Next volunteer
                        │  MONITOR AGENT  │            │
                        │  Heartbeat loop │    Coverage failure?
                        └────────┬────────┘            │
                                 │              Crisis Commander
                    ┌────────────┼────────────┐  → Escalate to NDRF
                    ▼            ▼            ▼
               Timeout        Drift       Resolved
                    │            │            │
                    ▼            ▼            ▼
            Re-dispatch    Crisis        Documentation
            triggered    Commander       pipeline
                         re-plans     → Incident report
                                        generated
```

---

## 5. State Transition Table

| Event | Agent Triggered | Action |
|---|---|---|
| WhatsApp signal arrives | Signal Agent | Extract, geocode, create or strengthen incident |
| New incident created | Crisis Commander | Reason, invoke Triage + Dispatch |
| Existing incident updated | Triage Agent | Resolve conflicts, detect velocity |
| Severity upgraded | Crisis Commander | Re-evaluate coverage, consider NDRF |
| Task card sent | Dispatch Agent | Start 8-minute confirmation timer |
| Volunteer confirms | Monitor Agent | Begin 3-minute heartbeat surveillance |
| Volunteer unresponsive (8 min) | Dispatch Agent | Re-query PostGIS, dispatch next candidate |
| All candidates exhausted | Crisis Commander | Escalate to NDRF, alert coordinator |
| Arrival timeout exceeded | Monitor Agent | Check-in message, trigger re-dispatch |
| New signals show drift | Crisis Commander | Additional dispatch or severity upgrade |
| Incident resolved | Monitor Agent | Closure + auto-report generation |

---

## 6. Building with Claude Code

### The Core Flow

```
Prepare docs → Write CLAUDE.md → Write SPEC.md → Plan Mode → 
Approve plan → Build milestone by milestone → Test each → 
Update CLAUDE.md → Repeat
```

Never skip Plan Mode. Never build more than one milestone before testing. Always update CLAUDE.md after a milestone completes — it's Claude Code's only memory across sessions.

### Folder Setup Before Opening Claude Code

```
traan/
├── CLAUDE.md                     ← Claude Code memory (write this first)
├── SPEC.md                       ← Build spec (source of truth)
├── docs/
│   ├── Traan.md                  ← Overview + architecture + tech stack
│   └── Traan_Agentic_Workflow.md ← This file
└── skills/
    ├── gemini-calls.md
    ├── postgis-queries.md
    └── whatsapp-messages.md
```

### How to Start Each Claude Code Session

```
Read CLAUDE.md, SPEC.md, and docs/Traan_Agentic_Workflow.md before doing anything.
We are building [Milestone N: name].
The relevant section in Traan_Agentic_Workflow.md is [section number].
```

### How to Prompt for a Specific File

```
Write /backend/agents/signal_agent.py.
It must implement all tools listed in section 3.1 of Traan_Agentic_Workflow.md.
Follow the conventions in skills/gemini-calls.md.
After writing, tell me what tests I should run to verify it works.
```

### How to Handle Bugs

```
The geocoding step in signal_agent.py returns None for "Kareli village, near Nashik".
Error: [paste error]
Check geo_service.py and fix without changing the function signature.
```

### How to Review Before Moving On

```
Before we move to Milestone [N+1], review everything built so far against SPEC.md.
List any gaps or anything that doesn't match the spec.
```
----

## 9. Claude Code Skills

Create these files in `/skills/` before starting. Reference them in every prompt.

### `/skills/gemini-calls.md`

```markdown
# Gemini Call Conventions for Traan

- Always use model: gemini-1.5-pro (never flash or nano for agent reasoning)
- All Gemini calls must go through /backend/services/gemini_fusion.py
- Always wrap calls in try/except and log errors with incident_id context
- Always strip ```json fences before parsing: response.text.strip().replace("```json","").replace("```","")
- Always validate that required fields exist in extraction before writing to DB
- If confidence < 0.4, flag the signal as low_confidence but still process it
- Audio: encode as base64, mime_type audio/ogg
- Image: encode as base64, mime_type image/jpeg
- Return structured dict from every function — never return raw Gemini response
- Crisis Commander system prompt must include: all active incidents, volunteer map, current timestamp
```

### `/skills/postgis-queries.md`

```markdown
# PostGIS Query Conventions for Traan

- All PostGIS queries must go through /backend/services/geo_service.py
- Always use ST_DWithin for radius checks — faster than ST_Distance filter
- Always cast geometry to geography for accurate meter-based distance: location::geography
- Always use bound parameters with SQLAlchemy text() — never string-format SQL
- Volunteer nearest-neighbor: ORDER BY ST_Distance ASC, LIMIT configurable (default 5)
- Corroboration check radius: 2km, time window: 2 hours
- Always ensure spatial indexes exist before running queries (idx_incidents_coordinates, idx_volunteers_location)
- For incident clustering: ST_Collect + ST_ConvexHull for bounding polygons
- Distance unit: always meters internally, convert to km for display
```

### `/skills/whatsapp-messages.md`

```markdown
# WhatsApp Message Conventions for Traan

- All outbound messages must go through /backend/services/whatsapp_sender.py
- Never send WhatsApp messages directly from agent files
- Task card must include: incident location, volunteer role, approach route, ETA, confirm instruction
- Confirm instruction always: "Reply 1 to confirm, 2 to decline"
- Check-in message must reference the specific incident so volunteer knows which crisis
- Follow-up message (after 8 min no response) must be shorter and more urgent than task card
- Log every outbound message to events table: volunteer_id, incident_id, message_type, timestamp
- Never send more than 3 messages to the same volunteer for the same incident
- If volunteer replies anything other than 1 or 2, treat as unresponsive after 13 total minutes
```

---

## 10. Build Order & Milestones

Build exactly one milestone at a time. Test before moving to the next. Tell Claude Code explicitly which milestone you are on at the start of every session.

### Milestone 1 — Foundation
**What to build:** DB schema + SQLAlchemy models + environment config + FastAPI skeleton + docker-compose

**Test:** `docker-compose up` starts without errors. PostgreSQL with PostGIS running. All tables created. FastAPI returns 200 on `/health`.

**Prompt to use:**
```
Read CLAUDE.md and SPEC.md. Build Milestone 1: Foundation.
Create: docker-compose.yml with FastAPI + PostgreSQL/PostGIS, 
the full DB schema from docs/Traan.md section 7, 
SQLAlchemy models for all tables, 
config.py loading all env vars from .env.example,
and a FastAPI main.py with /health endpoint.
Stop after that. Tell me how to test it.
```

---

### Milestone 2 — Signal Agent
**What to build:** WhatsApp webhook endpoint + Gemini multimodal extraction + geocoding + incident create/strengthen

**Test:** POST a fake WhatsApp audio payload to `/webhook` → incident appears in DB with coordinates populated.

**Prompt to use:**
```
Read CLAUDE.md and docs/Traan_Agentic_Workflow.md section 3.1.
Build Milestone 2: Signal Agent.
Follow conventions in skills/gemini-calls.md and skills/postgis-queries.md.
Create: /backend/api/webhook.py (Meta verification + payload receiver),
/backend/services/gemini_fusion.py (multimodal extract),
/backend/services/geo_service.py (geocode_location + query_nearby_incidents),
/backend/agents/signal_agent.py (all tools from section 3.1).
Stop after. Tell me the test payload to use.
```

---

### Milestone 3 — Triage Agent
**What to build:** Conflict resolution logic + signal velocity detection + severity upgrade

**Test:** POST two contradicting signals for the same location → DB shows resolved ground truth, not two conflicting rows.

---

### Milestone 4 — Crisis Commander
**What to build:** Gemini reasoning loop + agent invocation logic + situational context builder

**Test:** New incident fires → events table shows Commander reasoning output + correct agent invocations logged.

---

### Milestone 5 — Dispatch Agent
**What to build:** PostGIS volunteer query + WhatsApp task card + confirmation loop with 8-minute timeout + fallback

**Test:** Incident created with a seeded volunteer in DB → task card sent → simulate no response → verify auto re-dispatch fires after 8 minutes.

---

### Milestone 6 — Monitor Agent
**What to build:** APScheduler heartbeat + drift detection + check-in message + closure trigger

**Test:** Active dispatch with confirmed volunteer, no arrival update after ETA → check-in message fires → simulate no response → re-dispatch triggered.

---

### Milestone 7 — Pub/Sub Integration
**What to build:** Wire all agent handoffs through Pub/Sub instead of direct function calls

**Test:** Full end-to-end: WhatsApp webhook → Pub/Sub → Signal Agent → Commander → Dispatch Agent → task card received on test phone.

---

### Milestone 8 (Post-core) — Firebase + Dashboard Prep
**What to build:** Firebase event firing on every incident state change. Expose incident + dispatch endpoints for frontend consumption.

**Test:** State change in DB → Firebase event fires within 2 seconds. REST endpoints return correct incident + dispatch data.

---

*Traan — Agentic Workflow & Build Guide — April 2026*
