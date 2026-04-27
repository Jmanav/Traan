# DEPLOYMENT.md
> Based on a full audit of all source files. Every claim references actual code.

---

## 1. WHAT WAS FOUND

### Repository Layout (Critical Discovery)
There are **two backend directories** in this repo:
- `backend/` — contains only `__pycache__` files. **No Python source files.** This directory is dead.
- `Traan-backend/backend/` — contains all actual source: agents, api, models, services, config.
- `sevasense/` — the Next.js frontend.
- `alembic/` at root — also only `__pycache__`. **Dead.** Real migrations are in `Traan-backend/alembic/`.

All deployment commands must run from `Traan-backend/` as the working directory.

---

### Backend
| Property | Detail |
|---|---|
| Framework | FastAPI 0.111.0 |
| Python version | 3.11 (from `__pycache__` tag `cpython-311`) |
| Server | uvicorn[standard] 0.29.0 |
| DB driver (runtime) | asyncpg 0.29.0 (async) via SQLAlchemy 2.0.30 |
| DB driver (migrations) | psycopg2-binary 2.9.9 (sync, Alembic only) |
| ORM | SQLAlchemy 2.0 — async sessions via `create_async_engine` |
| Migrations | Alembic 1.13.1 |
| PostGIS client | GeoAlchemy2 0.14.7 |
| AI | google-generativeai 0.7.2, model `gemini-2.5-flash`, REST transport |
| HTTP client | httpx 0.27.0 (used in signal_agent, geo_service, telegram_sender) |
| Execution model | **Fully async** — asyncpg + asynccontextmanager lifespan |

**Key architecture details:**
- `main.py:11-21` — `engine` and `AsyncSessionLocal` are globals set at startup via lifespan; all routers do a deferred import of `main` to access them (avoids circular imports).
- `gemini_fusion.py:89-93` — Gemini SDK is synchronous; wrapped in `loop.run_in_executor` to prevent blocking the event loop.
- `geo_service.py:14` — Geocoding uses Nominatim (OSM), not Google Maps. No API key required.
- `webhook.py:31-35` — Dev secret bypass: any secret starting with `"traan"` or equal to `"placeholder"` skips auth. **Still present. Must be fixed before production.**
- ~~`dispatches.py:108-109` — Hardcoded `chat_id = 1283521836`~~ **FIXED** — now reads volunteer's `phone` field, casting to `int` as Telegram chat_id. Skips with a warning if missing or non-numeric.

---

### Frontend
| Property | Detail |
|---|---|
| Framework | Next.js ^16.2.4 (React ^19.2.5) |
| Build tool | Next.js built-in (Webpack/Turbopack) |
| Language | TypeScript 5.3.3, strict mode |
| Styling | Tailwind CSS 3.4.1 |
| Maps | Google Maps JS API (loaded dynamically) + Deck.gl 9.0.16 |
| Data fetching | SWR 2.2.5 — polls `/api/incidents` every 10s, `/api/volunteers` every 15s |
| State | React Context (`DashboardContext.tsx`) |
| Auth | None — no auth layer exists in the frontend |

**How frontend connects to backend:**
- `useIncidents.ts:8` and `useVolunteers.ts:8` — reads `process.env.NEXT_PUBLIC_API_BASE_URL`
- If that env var is **not set**, the hooks fall back to mock data automatically (no crash)
- If it **is set**, SWR fetches live from `${API_BASE}/api/incidents` and `${API_BASE}/api/volunteers`
- `GoogleCrisisMap.tsx:55` — reads `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for map loading
- ~~`main.py:29` — hardcoded `localhost:3000`~~ **FIXED** — CORS now reads `config.FRONTEND_URL`, which is loaded from the `FRONTEND_URL` env var (default `http://localhost:3000`).

**Firebase:**
- `firebase.ts` exports only `export const isMockMode = true`. Firebase has been fully removed. Safe to ignore.

---

### Database
| Property | Detail |
|---|---|
| Engine | PostgreSQL 15 + PostGIS |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic — single migration `0001_initial_schema.py` |
| Connection string format | `postgresql+asyncpg://user:pass@host:5432/dbname` (runtime) |
| Alembic connection | `postgresql+psycopg2://` (sync, derived in `alembic/env.py:24-25`) |
| Schema | 6 tables: `ngos`, `incidents`, `volunteers`, `signals`, `dispatches`, `events` |
| PostGIS usage | `GEOMETRY(POINT, SRID 4326)` on `incidents.coordinates` and `volunteers.location`; ST_DWithin, ST_MakePoint, ST_SetSRID, ST_X, ST_Y used in queries |
| Spatial indexes | `idx_incidents_coordinates` (GIST), `idx_volunteers_location` (GIST) — created in migration |

**Critical alembic.ini issue (`Traan-backend/alembic.ini:4`):**
```
sqlalchemy.url = postgresql+psycopg2://traan:traan@localhost:5432/traan
```
This is a hardcoded fallback. The `alembic/env.py:24-25` correctly overrides it from `DATABASE_URL` env var — but only if `DATABASE_URL` is set. If not set, Alembic uses this hardcoded local URL.

---

### External Services
| Service | Where called | Credential source |
|---|---|---|
| Gemini API (gemini-2.5-flash) | `gemini_fusion.py:47` | `GEMINI_API_KEY` via `config.py:20` |
| Telegram Bot API (sendMessage, getFile) | `telegram_sender.py`, `signal_agent.py:16-17` | `TELEGRAM_BOT_TOKEN` via `config.py:24` |
| Nominatim OSM Geocoding | `geo_service.py:14` | No key — `User-Agent: Traan-Crisis-App/1.0` header only |
| Google Maps JS API (frontend) | `GoogleCrisisMap.tsx:80` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (env var, frontend) |

**Not yet wired (placeholders only):**
- Google Maps Routes API — `GOOGLE_MAPS_API_KEY` exists in config but unused (Dispatch Agent not built)
- Google Cloud Pub/Sub — `PUBSUB_PROJECT_ID`, `PUBSUB_TOPIC_ID` are placeholders, no consumer exists
- Firebase — fully removed

---

### Hardcoded Dev Values — Status

| Location | Issue | Status |
|---|---|---|
| ~~`main.py:29`~~ | ~~`allow_origins=["http://localhost:3000"]`~~ | **FIXED** — reads `config.FRONTEND_URL` |
| `webhook.py:31-35` | `_DEV_SECRETS = {"placeholder"}` and `startswith("traan")` bypass | **STILL OPEN** |
| ~~`dispatches.py:108-109`~~ | ~~`chat_id = 1283521836` hardcoded~~ | **FIXED** — uses volunteer's phone field |
| `Traan-backend/alembic.ini:4` | Hardcoded `localhost` Alembic URL | **STILL OPEN** — safe only if `DATABASE_URL` always set |
| `sevasense/.env.example` | `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` | **STILL OPEN** — update before Vercel deploy |
| **No `.gitignore` at repo root** | `.env` with live API keys is untracked and unprotected | **NEW — CRITICAL** |

---

## 2. DEPLOYMENT TARGETS

### Backend — Google Cloud Run
**Why:** FastAPI + uvicorn runs as a single stateless process; Cloud Run containers scale to zero, bill per request, and have native support for Python containers. The async architecture (asyncpg) is well-suited to Cloud Run's concurrency model. Free tier: 2M requests/month, 360K GB-seconds compute — sufficient for hackathon demo.

**Container:** Build from `Traan-backend/` with a `Dockerfile` exposing port 8080. Inject all env vars as Cloud Run secrets.

**Telegram webhook requirement:** Cloud Run gives a stable HTTPS URL — register it with Telegram via:
```
POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<cloud-run-url>/webhook
```

### Frontend — Vercel
**Why:** Next.js is Vercel's native framework — zero-config deploy, automatic CDN, Edge network. Free hobby tier supports unlimited bandwidth for demo. `next build` + `next start` works out of the box.

**Alternative:** Cloud Run (build container with `next build && next start`). Less convenient but keeps everything in Google Cloud for the competition judges.

### Database — Supabase (PostgreSQL + PostGIS)
**Why:** Supabase's free tier provides a managed PostgreSQL 15 instance with the PostGIS extension pre-installed. No configuration needed to enable PostGIS. Free tier: 500MB storage, pauses after 1 week of inactivity (acceptable for demo). Connection string format matches what the app already uses.

**Alternative:** Cloud SQL for PostgreSQL (Google Cloud) — better for a Google competition submission, but no free tier; ~$7/month minimum on smallest instance.

---

## 3. ENVIRONMENT VARIABLES FOR PRODUCTION

### Backend (Cloud Run secrets / environment)

| Variable | Used In | Dev Value | Production Value |
|---|---|---|---|
| `DATABASE_URL` | `config.py:6`, `alembic/env.py:24` | `postgresql+asyncpg://traan:traan@localhost:5432/traan` | `postgresql+asyncpg://<user>:<pass>@<supabase-host>:5432/<db>` |
| `GEMINI_API_KEY` | `config.py:20`, `gemini_fusion.py:47` | (actual key in `.env`) | Same key or a new production key |
| `TELEGRAM_BOT_TOKEN` | `config.py:24`, `telegram_sender.py`, `signal_agent.py` | (actual token in `.env`) | Same token (or a prod bot) |
| `TELEGRAM_WEBHOOK_SECRET` | `config.py:25`, `webhook.py:44` | `"placeholder"` | A strong random string (32+ chars), registered with Telegram |
| `GOOGLE_MAPS_API_KEY` | `config.py:23` (backend, unused currently) | (actual key in `.env`) | Optional until Dispatch Agent is built |
| `FRONTEND_URL` | `config.py:26`, `main.py:28` | `http://localhost:3000` | `https://<your-vercel-domain>.vercel.app` |
| `FIREBASE_CREDENTIALS_PATH` | `config.py:29` | `"placeholder"` | Leave as `"placeholder"` — Firebase is removed |
| `PUBSUB_PROJECT_ID` | `config.py:30` | `"placeholder"` | Leave as `"placeholder"` until Milestone 7 |
| `PUBSUB_TOPIC_ID` | `config.py:31` | `"placeholder"` | Leave as `"placeholder"` until Milestone 7 |

### Frontend (Vercel environment variables)

| Variable | Used In | Dev Value | Production Value |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `useIncidents.ts:8`, `useVolunteers.ts:8` | `http://localhost:8000` | `https://<cloud-run-backend-url>` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `GoogleCrisisMap.tsx:55` | (actual key) | Same key — restrict it to your Vercel domain in Google Cloud Console |

---

## 4. PRE-DEPLOYMENT CHECKLIST

### MUST FIX — blocks correct production behavior

- [x] ~~**`Traan-backend/backend/main.py:29`** — Replace `"http://localhost:3000"` with the production Vercel URL.~~ **DONE** — CORS now uses `config.FRONTEND_URL` env var.

- [ ] **Set `FRONTEND_URL` env var on Cloud Run** — Set to `https://<your-vercel-domain>.vercel.app` after frontend deploys. The code is wired; the value just needs to be injected.

- [ ] **`Traan-backend/backend/api/webhook.py:31-35`** — Remove the `_DEV_SECRETS` set and `_is_dev_secret` check. In production, `TELEGRAM_WEBHOOK_SECRET` must be a real secret and auth must always be enforced.

- [x] ~~**`Traan-backend/backend/api/dispatches.py:108-109`** — Remove hardcoded `chat_id = 1283521836`.~~ **DONE** — now uses volunteer's `phone` field as Telegram chat_id; logs a warning and skips if missing or non-numeric.

- [ ] **Set `TELEGRAM_WEBHOOK_SECRET`** — Change from `"placeholder"` to a real secret (32+ random chars). Register with Telegram: `POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<backend-url>/webhook&secret_token=<secret>`.

- [ ] **Run `alembic upgrade head` against production DB** — Set `DATABASE_URL` env var first so `alembic/env.py:24-25` derives the correct sync URL. Run from `Traan-backend/`.

- [ ] **No `.gitignore` at repo root** — The root `.env` containing live API keys has no gitignore protection. Create a `.gitignore` that includes `.env` before any further pushes. Keys must also be rotated — they are already in git history.

### SHOULD FIX — production quality

- [ ] **`Traan-backend/backend/services/gemini_fusion.py:89`** — `asyncio.get_event_loop()` is deprecated in Python 3.10+. Replace with `asyncio.get_running_loop()`.

- [ ] **Google Maps API key restriction** — Key currently unrestricted. In Google Cloud Console, restrict it to your Vercel domain (HTTP referrer restriction) before going live.

- [x] ~~**Write a `Dockerfile` for `Traan-backend/`**~~ **DONE** — `Traan-backend/Dockerfile` exists, uses `python:3.11-slim`, installs `requirements.txt`, copies `backend/`, runs uvicorn on `$PORT`. `.dockerignore` excludes `.env`, `venv/`, `__pycache__`, `.git`, `alembic/`, `timepass`.

- [ ] **Remove `Traan-backend/timepass`** — Contains the local postgres superuser password (`hello`) in plaintext. Delete before any public push.

- [ ] **`.env` in repo root** — Contains live API keys (GEMINI, Google Maps, Telegram token). Must be rotated (already in git history). Add `.env` to a root `.gitignore` immediately.

---

## 5. DEPLOYMENT ORDER

1. **Provision database (Supabase or Cloud SQL)**
   - Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - Get the connection string in `postgresql+asyncpg://` format.
   - Why first: everything else depends on schema existing.

2. **Run Alembic migration**
   - From `Traan-backend/`: set `DATABASE_URL` env var, then `alembic upgrade head`
   - This creates all 6 tables, PostGIS extension, and all spatial indexes.
   - Why second: backend crashes on startup if tables don't exist.

3. **Register Telegram webhook** (after backend URL is known — do this after step 4 if needed)
   - `POST https://api.telegram.org/bot<TOKEN>/setWebhook` with `url` and `secret_token`

4. **Deploy backend to Cloud Run**
   - Build container from `Traan-backend/`
   - Set all backend env vars as Cloud Run secrets
   - Verify `/health` returns `{"status": "ok"}` (hits DB)
   - Verify `/ready` returns `{"status": "ready"}`
   - Why before frontend: frontend needs the backend URL to configure `NEXT_PUBLIC_API_BASE_URL`

5. **Deploy frontend to Vercel**
   - Set `NEXT_PUBLIC_API_BASE_URL` to the Cloud Run URL
   - Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Run `next build` — Vercel does this automatically on push
   - Why last: needs backend URL to be known

---

## 6. POST-DEPLOYMENT VERIFICATION

```bash
# 1. Health check (confirms DB connection works)
curl https://<cloud-run-url>/health
# Expected: {"status":"ok"}

# 2. Ready check
curl https://<cloud-run-url>/ready
# Expected: {"status":"ready"}

# 3. List incidents (confirms schema + async DB path)
curl https://<cloud-run-url>/api/incidents
# Expected: [] (empty array on fresh DB, or incident objects if data exists)

# 4. List volunteers
curl https://<cloud-run-url>/api/volunteers
# Expected: []

# 5. List signals
curl https://<cloud-run-url>/api/signals
# Expected: []

# 6. Webhook auth check — should be rejected with wrong secret
curl -X POST https://<cloud-run-url>/webhook \
  -H "X-Telegram-Bot-Api-Secret-Token: wrongsecret" \
  -H "Content-Type: application/json" \
  -d '{"update_id":1}'
# Expected: {"ok":false,"error":"forbidden"}

# 7. Webhook with correct secret — should return ok
curl -X POST https://<cloud-run-url>/webhook \
  -H "X-Telegram-Bot-Api-Secret-Token: <your-real-secret>" \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"message":{"chat":{"id":123},"from":{"id":456},"text":"test flood in Pune"}}'
# Expected: {"ok":true}

# 8. Dispatch creation (replace UUIDs with real IDs from step 3+4)
curl -X POST https://<cloud-run-url>/api/dispatches \
  -H "Content-Type: application/json" \
  -d '{"incidentId":"<uuid>","volunteerId":"<uuid>"}'
# Expected: 201 with dispatch object
```

---

## 7. ROLLBACK PLAN

### Backend (Cloud Run)
Cloud Run keeps previous revisions. To roll back:
```bash
gcloud run services update-traffic traan-backend --to-revisions=<previous-revision>=100
```
The previous revision is listed in Cloud Run console under "Revisions".

### Frontend (Vercel)
Vercel keeps all deployment history. To roll back:
- Go to Vercel dashboard → Project → Deployments → click previous deployment → "Promote to Production"
- Or via CLI: `vercel rollback`

### Database
There is only one migration (`0001`). To roll back schema:
```bash
# From Traan-backend/ with DATABASE_URL set
alembic downgrade base
```
This drops all tables and the PostGIS extension. **Only do this on a dev/staging DB.** Production data cannot be recovered after downgrade.

---

## 8. KNOWN RISKS

### CRITICAL

**Risk 1 — Live API keys committed to git (`/.env`) — NO `.gitignore` EXISTS**
- File: repo root `.env` — `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `TELEGRAM_BOT_TOKEN` in plaintext.
- **New finding:** There is no `.gitignore` at the repo root at all. The file has no protection.
- If this repo is or becomes public (the `master` branch merge was in progress), all three keys are compromised.
- Fix: (1) Create a root `.gitignore` containing `.env`. (2) Rotate all three keys — they are already in git history and rotation is the only safe remediation. Run `git log --all --full-history -- .env` to confirm which commits contain them.

**Risk 2 — Webhook auth is disabled in dev mode (`webhook.py:31-35`) — STILL OPEN**
- `_DEV_SECRETS = {"placeholder"}` and `secret.startswith("traan")` bypass auth entirely.
- `TELEGRAM_WEBHOOK_SECRET` is currently `"placeholder"` in `.env` — so the bypass is active right now.
- Anyone who can reach the endpoint can POST arbitrary payloads and trigger the full Gemini + DB pipeline.
- Fix: Remove `_is_dev_secret` and `_DEV_SECRETS` from `webhook.py`. Set `TELEGRAM_WEBHOOK_SECRET` to a real secret before deploying.

~~**Risk 3 — Hardcoded Telegram chat_id (`dispatches.py:108-109`)**~~ **FIXED**
- Was: `chat_id = 1283521836` hardcoded, all notifications routed to developer's phone.
- Now: `dispatches.py` reads `volunteer_phone` from the volunteers table, casts to `int` as chat_id, skips with a warning if missing or non-numeric.

### HIGH

~~**Risk 4 — CORS blocks production frontend (`main.py:29`)**~~ **FIXED**
- Was: `allow_origins=["http://localhost:3000"]` hardcoded.
- Now: `allow_origins=[config.FRONTEND_URL]` — reads `FRONTEND_URL` env var, defaults to `http://localhost:3000`. Set to the Vercel URL on Cloud Run.

**Risk 5 — `postgres password` in plaintext (`Traan-backend/timepass`) — STILL OPEN**
- File committed to repo: `postgres pw = hello`.
- The `.dockerignore` excludes it from the container image, but it remains in git history.
- Fix: Delete the file and push. The local postgres password should also be changed if this repo ever becomes public.

**Risk 6 — `asyncio.get_event_loop()` deprecated (`gemini_fusion.py:89`) — STILL OPEN**
- `get_event_loop()` raises a `DeprecationWarning` in Python 3.10+ and will eventually raise a `RuntimeError`.
- Fix: Replace with `asyncio.get_running_loop()`.

### MEDIUM

**Risk 7 — No `telegram_chat_id` on volunteers table — STILL OPEN**
- Schema stores `phone` (VARCHAR 15) not a Telegram user ID. The dispatch fix in Risk 3 uses `phone` as a proxy, which only works if whoever added the volunteer stored their Telegram numeric user ID in that field.
- Until volunteers are registered via the bot (so their Telegram ID is captured at registration), dispatch notifications will silently skip for most volunteers.

~~**Risk 10 — No `Dockerfile` exists**~~ **FIXED**
- `Traan-backend/Dockerfile` now exists. Uses `python:3.11-slim`, installs `requirements.txt`, copies `backend/`, runs `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`. `.dockerignore` excludes `.env`, `venv/`, `__pycache__`, `.git`, `alembic/`, `timepass`.

**Risk 8 — Nominatim rate limit — UNCHANGED**
- `geo_service.py:94` — `asyncio.sleep(1)` is per-attempt within one geocode call, not across concurrent calls. Under simultaneous incoming signals, geocoding will throttle.
- Acceptable for hackathon demo load.

**Risk 9 — Gemini model `gemini-2.5-flash` is a preview model — UNCHANGED**
- `gemini_fusion.py:49` pins to `"gemini-2.5-flash"`. API availability and response format may change without notice.
