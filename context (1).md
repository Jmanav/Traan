# Traan — Full Developer & Agent Context

> **Purpose of this file:** This document is the authoritative source of truth for any developer, IDE, or AI agent continuing work on this codebase. Read this before writing any code. It covers the project purpose, architecture, data contracts, design system, current implementation state, and everything needed to extend the app without breaking existing functionality.

---

## 1. How Traan Works (Full System)
1. **Field worker** sends a voice note, image, or text to a **Telegram bot**.
2. A **Gemini AI** pipeline processes the signal — it extracts location, affected count, severity, resource needs, language — and creates a structured `Incident` object.
3. The `Incident` is written to a **local PostgreSQL database** via the FastAPI backend.
4. The **Traan dashboard** (this repo) fetches data from the backend API via SWR HTTP polling and renders incident pins on the map, rings alerts, and surfaces ranked volunteer matches.
5. A coordinator selects an incident, picks the best volunteer match, and dispatches them — triggering a Telegram message to the volunteer via the backend.

**The frontend in this repo is a fully functional prototype running on mock data.** The real PostgreSQL backend and Telegram integrations are built but the frontend is wired to stubs (see Section 11).

---

## 2. Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | TypeScript strict mode. No Pages Router. |
| Language | TypeScript | `strict: true` in tsconfig. No `any` except documented exceptions. |
| Styling | Tailwind CSS v3 + CSS custom properties | No component libraries (no shadcn, radix, MUI, chakra). |
| Map engine | Google Maps JavaScript API | Loaded manually via script injection (not `@vis.gl/react-google-maps`). |
| Heatmap / overlays | Deck.gl v9 (`@deck.gl/google-maps`) | `GoogleMapsOverlay` in raster mode (no Vector MapID required). |
| Global state | React Context API | Single `DashboardContext` — no Redux, no Zustand. |
| Forms | react-hook-form + zod | Used in auth forms only. |
| Icons | lucide-react | No other icon library. |
| Fonts | next/font/google | Space Grotesk (headings), Inter (body), JetBrains Mono (data/coordinates). |
| PWA | manifest.json present | `next-pwa` is stubbed in `next.config.mjs` — not yet activated. |
| HTTP | native fetch + SWR | SWR used for polling; no axios. |
| Animation | Tailwind CSS animate + CSS keyframes | No framer-motion. |

**Explicitly removed dependencies (do NOT reinstall):**
- `firebase` — not used. Persistence layer is PostgreSQL. Dashboard updates via SWR polling.
- `leaflet` / `react-leaflet` — replaced by Google Maps + Deck.gl.

---

## 3. Repository Structure

```
traan/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout: fonts, PWA meta, DashboardProvider wrapper
│   ├── globals.css                     # CSS custom properties + Tailwind base overrides + keyframes
│   ├── page.tsx                        # Landing page (public, no auth)
│   ├── auth/
│   │   └── page.tsx                    # Login + Signup (tab-toggled, mock auth)
│   ├── dashboard/
│   │   ├── layout.tsx                  # Three-panel shell: grid-cols-[280px_1fr_320px]
│   │   ├── page.tsx                    # Dashboard page (renders panels)
│   │   └── reports/
│   │       └── page.tsx                # Post-crisis report viewer (placeholder)
│   └── volunteer/
│       └── [id]/
│           └── page.tsx                # Dynamic volunteer profile
│
├── components/
│   ├── landing/                        # Hero, HowItWorks, ImpactStats, CTASection
│   ├── auth/                           # LoginForm, SignupForm (react-hook-form + zod)
│   ├── shared/                         # SeverityBadge, NeedTypePill, SignalTypeIcon, LoadingPulse
│   ├── volunteer/                      # ProfileHeader, SkillBadges, DispatchHistory, AvailabilityToggle
│   └── dashboard/
│       ├── LeftPanel/
│       │   ├── index.tsx               # Panel shell + logo
│       │   ├── CrisisStats.tsx         # Active / Deployed / Gaps metric counters
│       │   ├── SignalFeed.tsx          # Scrollable incident card list
│       │   ├── SignalCounter.tsx       # Animated total signal count ticker
│       │   ├── SigOverlay.tsx          # Expandable SIG card overlay (clicked from feed)
│       │   └── SigPopup.tsx            # Floating popup for SIG detail
│       ├── CenterPanel/
│       │   ├── index.tsx               # Map panel shell + coordinate display + vignette overlay
│       │   ├── CrisisMap.tsx           # Dynamic import wrapper for GoogleCrisisMap (SSR: false)
│       │   ├── GoogleCrisisMap.tsx     # THE MAP — all Google Maps + Deck.gl logic lives here
│       │   ├── IncidentPopup.tsx       # HTML popup card for incident details
│       │   ├── MapToolbar.tsx          # Layer toggles (Incidents/Volunteers/Gaps) + Crisis Mode button
│       │   └── LeafletMap.tsx          # DEPRECATED STUB — exports a null component. Do not use.
│       └── RightPanel/
│           ├── index.tsx               # Panel shell
│           ├── IncidentDetail.tsx      # Full incident metadata display
│           ├── VolunteerMatchList.tsx  # Ranked list of volunteer matches for selected incident
│           └── DispatchPanel.tsx       # Dispatch CTA + animated status tracker
│
├── lib/
│   ├── types.ts                        # All TypeScript interfaces and union types (source of truth)
│   ├── severity.ts                     # SEVERITY config map, scoreToTier(), timeAgo()
│   ├── context/
│   │   └── DashboardContext.tsx        # Global crisis state (React Context + Provider + hook)
│   ├── hooks/
│   │   ├── useIncidents.ts             # Returns incident list (currently from mock data)
│   │   ├── useVolunteers.ts            # Returns volunteer list (currently from mock data)
│   │   └── useSignalCounter.ts         # Animated signal counter hook
│   └── mock/
│       ├── incidents.ts                # 6+ realistic mock incidents across Maharashtra
│       └── volunteers.ts               # 8 mock volunteers + getVolunteerMatches() algorithm
│
├── public/
│   └── manifest.json                   # PWA manifest (name: "Traan", theme: #F97316)
│
├── .env.example
├── next.config.mjs                     # next-pwa stub (commented out), reactStrictMode: true
├── tailwind.config.ts                  # Tailwind + custom color tokens
└── tsconfig.json                       # strict: true, path alias @ → ./
```

---

## 4. Design System

This is a **military/tactical dark theme**. Every color decision is deliberate. Agents must follow these tokens precisely.

### CSS Custom Properties (defined in `app/globals.css` and `tailwind.config.ts`)

```css
:root {
  --bg-base:        #0A0E1A;   /* Darkest — page background */
  --bg-surface:     #111827;   /* Panel backgrounds */
  --bg-elevated:    #1a2235;   /* Cards, hover states, inputs */
  --border:         #1F2937;   /* All borders and dividers */
  --accent-orange:  #F97316;   /* PRIMARY action color — CTAs, highlights */
  --accent-blue:    #3B82F6;   /* Secondary — volunteers, info */
  --accent-green:   #10B981;   /* Success, available status */
  --critical:       #EF4444;   /* Critical severity */
  --urgent:         #F97316;   /* Urgent severity (same as orange) */
  --moderate:       #EAB308;   /* Moderate severity */
  --text-primary:   #F9FAFB;   /* Main text */
  --text-muted:     #6B7280;   /* Secondary/label text */
  --text-data:      #A5F3FC;   /* Cyan — coordinate readouts, AI scores, IDs */
}
```

### Tailwind Token Mapping
In Tailwind classes, the above map to: `bg-base`, `bg-surface`, `bg-elevated`, `border-border`, `text-orange`, `text-blue`, `text-green`, `text-critical`, `text-urgent`, `text-moderate`, `text-primary`, `text-muted`, `text-data`.

### Typography Rules (strict)
- **Headings / labels / nav:** `font-space-grotesk` — Space Grotesk
- **Body / UI copy:** `font-inter` — Inter
- **Coordinates, timestamps, IDs, scores, counters:** `font-mono` + `text-data` color
- **Metric numbers on dashboard:** minimum `text-4xl font-bold font-mono`

### Severity System (`lib/severity.ts`)

```typescript
const SEVERITY = {
  critical: { color: '#EF4444', label: 'CRITICAL', glow: 'shadow-[0_0_12px_#EF4444]' },
  urgent:   { color: '#F97316', label: 'URGENT',   glow: 'shadow-[0_0_12px_#F97316]' },
  moderate: { color: '#EAB308', label: 'MODERATE', glow: '' },
};

// >= 75 → 'critical' | >= 50 → 'urgent' | < 50 → 'moderate'
scoreToTier(score: number): SeverityTier
```

Always use `SEVERITY[incident.tier].color` for severity-related coloring. Never hardcode `#EF4444` inline.

### Key CSS Animations (defined in `globals.css`)
```css
@keyframes crisis-pulse        /* Expanding ring on critical map pins */
@keyframes signal-enter        /* Slide-in + orange flash for new feed cards */
@keyframes breathe             /* Slow opacity pulse for empty states */
@keyframes availability-pulse  /* Soft ring pulse on available volunteer markers */
@keyframes dispatch-step       /* Pop animation for dispatch tracker steps */
@keyframes glow-pulse          /* Pulsing box-shadow for Crisis Mode button */
```

---

## 5. Data Models (`lib/types.ts`)

These are the canonical TypeScript interfaces. The entire app is typed against these. The PostgreSQL database schema, mock data, and all component props must match these exactly.

```typescript
type SignalType     = 'audio' | 'image' | 'text';
type SeverityTier   = 'critical' | 'urgent' | 'moderate';
type IncidentStatus = 'active' | 'dispatched' | 'resolved';
type DispatchStatus = 'sent' | 'confirmed' | 'en_route' | 'arrived';

interface Coordinates {
  lat: number;
  lng: number;
}

interface Incident {
  id: string;               // UUID string
  locationRaw: string;      // e.g. "Kareli, Nashik, Maharashtra"
  coordinates: Coordinates;
  severityScore: number;    // 0–100
  tier: SeverityTier;
  needTypes: string[];      // ['evacuation', 'rescue', 'medical', 'food', 'water', 'shelter']
  vulnerableGroups: string[];
  affectedCount: number;
  accessConstraints: string;
  status: IncidentStatus;
  signalCount: number;
  confidence: number;       // 0.0–1.0
  signalType: SignalType;
  languageDetected: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

interface Volunteer {
  id: string;
  name: string;
  phone: string;            // "+91XXXXXXXXXX"
  skills: string[];
  languages: string[];      // ISO 639-1: ['HI', 'MR', 'EN', 'GU']
  coordinates: Coordinates;
  isAvailable: boolean;
  lastSeen: string;         // ISO 8601
  ngoId: string;
  dispatchCount: number;
  avatarUrl?: string;
}

interface VolunteerMatch {
  volunteer: Volunteer;
  distanceKm: number;
  skillMatchScore: number;  // 0–100
}

interface Dispatch {
  id: string;
  incidentId: string;
  volunteerId: string;
  status: DispatchStatus;
  dispatchedAt: string;
  confirmedAt?: string;
  estimatedEta?: number;    // minutes
}

interface Signal {
  id: string;
  incidentId?: string;
  signalType: SignalType;
  rawText?: string;
  extractedJson?: Partial<Incident>;
  receivedAt: string;
  telegramMessageId?: string;
}
```

### Volunteer Skill Taxonomy
```
flood_rescue, navigation, medical, first_aid, trauma_support,
evacuation_coord, driving_4x4, logistics, hazmat, community_liaison
```

### needTypes → skills Mapping
```
rescue     → ['flood_rescue', 'navigation']
medical    → ['medical', 'first_aid', 'trauma_support']
evacuation → ['evacuation_coord', 'driving_4x4']
food       → ['logistics']
shelter    → ['logistics', 'evacuation_coord']
water      → ['logistics']
hazmat     → ['medical', 'first_aid']
```

---

## 6. Global State (`lib/context/DashboardContext.tsx`)

```typescript
interface DashboardState {
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;

  activeLayer: 'incidents' | 'volunteers' | 'gaps';
  setActiveLayer: (layer: 'incidents' | 'volunteers' | 'gaps') => void;

  crisisMode: boolean;
  setCrisisMode: (active: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  panToCoordinates: (lat: number, lng: number) => void;
  registerMapPan: (fn: (lat: number, lng: number) => void) => void;

  selectedVolunteerId: string | null;
  setSelectedVolunteerId: (id: string | null) => void;
}
```

---

## 7. The Map Engine (`GoogleCrisisMap.tsx`) — Architecture Deep Dive

### Script Loading Pattern
```typescript
window.__mapsCallbackReady = () => setMapsLoaded(true);
// script tag uses &callback=__mapsCallbackReady
// prevents "Map is not a constructor" race condition
```

### Deck.gl Heatmap
- `HeatmapLayer` from `@deck.gl/aggregation-layers` (NOT deprecated `google.maps.visualization.HeatmapLayer`)
- Wrapped in `GoogleMapsOverlay` in raster mode — no Vector MapID required
- Color stops: Blue → Emerald → Lime → Yellow → Orange → Red → Dark Red

### Custom Marker System
Incident pins and volunteer badges extend `google.maps.OverlayView`. Created via `createOverlayClass()` useCallback. Tracked in `overlaysRef.current[]`. Always call `clearOverlays()` at the start of the render useEffect.

### Layer Rendering Logic
```
activeLayer === 'incidents'  → incident pins + heatmap (+ selected volunteer pin if set)
activeLayer === 'volunteers' → all volunteer pins
activeLayer === 'gaps'       → gap zone circles
```

---

## 8. Volunteer Matching Algorithm (`lib/mock/volunteers.ts`)

1. Filter to `isAvailable === true`
2. `distanceKm = sqrt(dLat² + dLng²) * 111`
3. Map needTypes → required skills
4. `skillMatchScore = (matched / required) * 100`, capped at 100
5. Sort by `skillScore * 0.6 + proximityScore * 0.4`
6. Return top 5

---

## 9. Dashboard Layout Rules

Shell: `h-screen overflow-hidden grid grid-cols-[280px_1fr_320px]`

- **NEVER** put `overflow: scroll/auto` on `<body>`, `<html>`, or the outer grid wrapper
- Only `SignalFeed` and the RightPanel content area use `overflow-y-auto`
- CenterPanel: `relative h-screen overflow-hidden` — map fills absolutely
- z-index stack: tiles (0) → Deck.gl (1) → markers (10–500) → MapToolbar (1000) → coordinates (400)

---

## 10. Authentication

UI-only prototype. No real auth backend.
- `react-hook-form` + `zod` validation
- 1.2s simulated delay → redirect to `/dashboard`
- Planned: JWT-based, email/password, HTTP-only cookies

---

## 11. Backend Integration Points

Frontend polls the FastAPI backend (`http://localhost:8000`) via SWR. No WebSockets. No Firebase.

### REST API Endpoints

```
GET   /api/incidents        → all incidents, severity DESC
GET   /api/incidents/{id}   → single incident
PATCH /api/incidents/{id}   → body: { status }
GET   /api/volunteers       → all volunteers
PATCH /api/volunteers/{id}  → body: { isAvailable }
POST  /api/dispatches       → body: { incidentId, volunteerId }
GET   /api/signals          → 20 most recent signals
```

### Wiring `useIncidents.ts`

```typescript
import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useIncidents() {
  const { data, error, isLoading } = useSWR<Incident[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/incidents`,
    fetcher,
    { refreshInterval: 10000 }
  );
  const incidents = data ?? [];
  return {
    incidents,
    activeIncidents: incidents.filter(i => i.status === 'active'),
    dispatchedIncidents: incidents.filter(i => i.status === 'dispatched'),
    loading: isLoading,
  };
}
```

### Wiring `useVolunteers.ts`

Same SWR pattern, endpoint `/api/volunteers`, `refreshInterval: 15000`.

### Dispatch Action (`DispatchPanel.tsx`)

```typescript
const handleDispatch = async () => {
  setState('sending');
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dispatches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentId: incident.id, volunteerId: selectedVolunteerId }),
  });
  setState('sent');
};
```

---

## 12. Environment Variables

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Google Maps JS API for the dashboard map
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Never commit actual keys. Use `.env.local` (git-ignored).

---

## 13. What's Working vs. Stubbed

| Feature | Status | Notes |
|---|---|---|
| Landing page | ✅ Complete | All sections |
| Auth UI | ✅ Complete | Mock redirect only |
| Dashboard three-panel layout | ✅ Complete | Desktop 1280px+ |
| Signal feed | ✅ Complete | Mock data |
| Crisis stats counters | ✅ Complete | Mock data |
| Google Maps dark mode | ✅ Complete | Custom inline JSON style |
| Deck.gl GPU heatmap | ✅ Complete | Multi-stop gradient |
| Incident map pins | ✅ Complete | Custom OverlayView, severity-colored |
| Volunteer map badges | ✅ Complete | Neon cyan glow, initials |
| Volunteer radar on dispatch | ✅ Complete | Via selectedVolunteerId context |
| MapToolbar layer switching | ✅ Complete | Incidents / Volunteers / Gaps |
| Crisis Mode toggle | ✅ Complete | UI state only |
| Incident detail (right panel) | ✅ Complete | Full metadata |
| Volunteer match list | ✅ Complete | Algorithm-ranked |
| Dispatch flow (simulated) | ✅ Complete | Sent → Confirmed → En Route animation |
| Volunteer profile page | ✅ Complete | Mock data |
| PostgreSQL backend connection | ❌ Stubbed | Replace SWR fetchers (Section 11) |
| Real dispatch to volunteer | ❌ Stubbed | POST to /api/dispatches (Section 11) |
| Mobile responsive layout | ❌ Not built | Target: bottom tab nav <768px |
| PWA service worker | ❌ Not activated | next-pwa stub in next.config.mjs |
| Reports page | ❌ Placeholder | app/dashboard/reports/page.tsx empty |
| JWT auth with backend | ❌ Not built | Replace onSubmit in auth forms |

---

## 14. Rules for Agents and Developers

1. **TypeScript strict.** Only documented exception: `(process as any).env` in `GoogleCrisisMap.tsx`.
2. **Design system first.** Use CSS tokens and Tailwind classes. Never use arbitrary colors like `text-[#EF4444]` — use `text-critical`.
3. **Panel overflow contract.** Outer grid stays `overflow-hidden`. Scroll only inside `SignalFeed` and RightPanel content.
4. **Marker lifecycle.** Always push new overlays to `overlaysRef.current[]` and call `clearOverlays()` at render start. Leaking overlays cause ghost markers.
5. **No new dependencies without reason.** Package.json is deliberately minimal.
6. **Animations via transform/opacity only.** Never animate `width`, `height`, `top`, `left`, or `margin`.
7. **Geography context.** All mock data is in Maharashtra, India (lat ~18–21, lng ~72–75).
8. **Signal feed cards must use `signal-enter` animation** on mount, left border colored by `SEVERITY[incident.tier].color`.
9. **No Firebase.** Not installed, not used, do not add it.

---

*Google Solutions Challenge 2026*
