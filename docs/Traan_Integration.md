# Traan — Frontend to Backend Integration Guide

---

## 1. Data Flow

```
Telegram message
    → POST /webhook/telegram  (FastAPI)
    → Signal Agent processes + geocodes
    → INSERT incidents / signals  (PostgreSQL)
    → SWR polls GET /api/incidents every 10s
    → Dashboard renders updated map + list
```

Frontend never writes directly to the DB.
All mutations go through REST endpoints.
No WebSockets. No Firebase.

---

## 2. API Endpoints

| Method | Path | Query / Body | Returns |
|--------|------|--------------|---------|
| GET | `/api/incidents` | — | Incidents ordered by severity DESC |
| GET | `/api/incidents/{id}` | — | Single incident |
| PATCH | `/api/incidents/{id}` | `{ "status": "resolved" }` | Updated incident |
| GET | `/api/volunteers` | — | All volunteers |
| PATCH | `/api/volunteers/{id}` | `{ "isAvailable": true }` | Updated volunteer |
| POST | `/api/dispatches` | `{ "incidentId": "uuid", "volunteerId": "uuid" }` | Created dispatch |
| GET | `/api/signals` | — | 20 most recent signals |

All endpoints return JSON. All IDs are UUIDs (strings). HTTP 200 on success, 422 on validation error, 404 if not found.

---

## 3. Field Mapping — PostgreSQL → TypeScript

### incidents

| PostgreSQL | TypeScript | Notes |
|------------|------------|-------|
| `id` (UUID) | `id: string` | — |
| `title` | `title: string` | — |
| `description` | `description: string` | — |
| `severity` | `severity: number` | 1–5 |
| `status` | `status: "active" \| "resolved" \| "dispatched"` | — |
| `location` (GEOMETRY) | `location: { lat: number; lng: number }` | Backend extracts x/y |
| `created_at` (TIMESTAMPTZ) | `createdAt: string` | ISO 8601 |
| `updated_at` (TIMESTAMPTZ) | `updatedAt: string` | ISO 8601 |

### volunteers

| PostgreSQL | TypeScript | Notes |
|------------|------------|-------|
| `id` (UUID) | `id: string` | — |
| `name` | `name: string` | — |
| `phone` | `phone: string` | — |
| `location` (GEOMETRY) | `location: { lat: number; lng: number }` | — |
| `is_available` | `isAvailable: boolean` | — |
| `skills` (TEXT[]) | `skills: string[]` | — |

### dispatches

| PostgreSQL | TypeScript | Notes |
|------------|------------|-------|
| `id` (UUID) | `id: string` | — |
| `incident_id` (UUID) | `incidentId: string` | — |
| `volunteer_id` (UUID) | `volunteerId: string` | — |
| `dispatched_at` (TIMESTAMPTZ) | `dispatchedAt: string` | ISO 8601 |
| `status` | `status: "pending" \| "en_route" \| "on_scene"` | — |

---

## 4. Backend Files to Build (in order)

1. **`backend/api/incidents.py`** — GET all (severity DESC), GET one by ID, PATCH status
2. **`backend/api/volunteers.py`** — GET all, PATCH `is_available`
3. **`backend/api/dispatches.py`** — POST creates dispatch record + sends Telegram confirmation via `telegram_sender.py`
4. **`backend/api/signals.py`** — GET 20 most recent signals ordered by `received_at DESC`
5. **`backend/main.py`** — register all routers under `/api` prefix, add CORS origin `http://localhost:3000`

Each endpoint must log to the `events` table (`agent_name="api"`, `incident_id`, `action`, `outcome`).

---

## 5. Frontend Files to Change

### `lib/hooks/useIncidents.ts`

```ts
// Before
const [incidents, setIncidents] = useState(MOCK_INCIDENTS);

// After
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());
export function useIncidents() {
  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/incidents`,
    fetcher,
    { refreshInterval: 10000 }
  );
  return { incidents: data ?? [], isLoading: !data && !error, error };
}
```

### `lib/hooks/useVolunteers.ts`

```ts
// Before
const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);

// After
export function useVolunteers() {
  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/volunteers`,
    fetcher,
    { refreshInterval: 15000 }
  );
  return { volunteers: data ?? [], isLoading: !data && !error, error };
}
```

### `components/dashboard/RightPanel/DispatchPanel.tsx`

```ts
// Before
onClick={() => console.log("dispatch")}

// After
async function handleDispatch(incidentId: string, volunteerId: string) {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId, volunteerId }),
  });
}
```

### `components/volunteer/AvailabilityToggle.tsx`

```ts
// Before
onClick={() => setAvailable(!available)}

// After
async function toggleAvailability(id: string, current: boolean) {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/volunteers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isAvailable: !current }),
  });
}
```

---

## 6. Environment Variables

**`frontend/.env.local`**

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**`backend/.env`** (already defined in `config.py`)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/traan
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 7. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

Backend runs separately:

```bash
# from project root, with venv active
uvicorn backend.main:app --reload   # http://localhost:8000
```

---

## 8. E2E Test Steps

1. Start backend: `uvicorn backend.main:app --reload`
2. Start frontend: `npm run dev` inside `frontend/`
3. Send a Telegram message (text or voice note) to the bot
4. Wait ~10 seconds for the SWR poll cycle
5. Open `http://localhost:3000` — new incident should appear on the map and list
6. Click a volunteer → toggle availability → PATCH fires, volunteer card updates on next poll
7. Open Dispatch panel → select incident + volunteer → POST fires
8. Verify in PostgreSQL: `SELECT * FROM dispatches ORDER BY dispatched_at DESC LIMIT 1;`
9. Verify Telegram bot sent confirmation message to the volunteer

---

## 9. Out of Scope

- **Firebase** — not used in this project
- WebSockets / SSE
- PWA / service workers
- Mobile layout
- Reports page
