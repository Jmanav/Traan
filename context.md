# Traan — Full Developer & Agent Context

> **Purpose of this file:** This document is the authoritative source of truth for any developer, IDE, or AI agent continuing work on this codebase. Read this before writing any code. It covers the project purpose, architecture, data contracts, design system, current implementation state, and everything needed to extend the app without breaking existing functionality.

---

## 1. Project Overview

**Traan** is a crisis coordination Progressive Web App (PWA) for NGO coordinators managing disaster response in India. It was built as a submission for the **Google Solutions Challenge 2026** under team **Recursive Impact**, targeting **SDG 11** (Sustainable Cities) and **SDG 17** (Partnerships).

### The Problem It Solves
During natural disasters, field workers (volunteers, affected civilians) generate raw, unstructured information: voice notes in Hindi/Marathi, fragmented text messages, photos of flooded roads. This data never gets digitized or reaches coordinators in time. The 0–6 hour window after a crisis event is critical, and most NGOs are blind during it.

### How Traan Works (Full System)
1. **Field worker** sends a voice note, image, or text to a **Telegram bot** (backend, not in this repo).
2. A **Gemini AI** pipeline processes the signal — it extracts location, affected count, severity, resource needs, language — and creates a structured `Incident` object.
3. The `Incident` is written to a **Firebase Realtime Database**.
4. The **Traan dashboard** (this repo) listens to Firebase in real time and renders incident pins on a map, rings alerts, and surfaces ranked volunteer matches.
5. A coordinator selects an incident, picks the best volunteer match, and dispatches them — triggering a Telegram message to the volunteer.

**The frontend in this repo is a fully functional prototype running on mock data.** The real Firebase and Telegram integrations are built but wired as stubs (see Section 11).

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
- `firebase` — removed due to `undici` security vulnerabilities (CVE-level). Backend wiring is stubbed.
- `leaflet` / `react-leaflet` — replaced by Google Maps + Deck.gl.

---

## 3. Repository Structure

```
sevasense/
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
│   ├── firebase.ts                     # STUB: exports isMockMode = true. No firebase SDK imported.
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
├── .env.example                        # Public template for required environment variables
├── .gitignore                          # Excludes node_modules, .next, .env*.local, build artifacts
├── README.md                           # Human-readable project summary
├── context.md                          # THIS FILE — full agent/developer context
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
// Color + label + glow per tier
const SEVERITY = {
  critical: { color: '#EF4444', label: 'CRITICAL', glow: 'shadow-[0_0_12px_#EF4444]' },
  urgent:   { color: '#F97316', label: 'URGENT',   glow: 'shadow-[0_0_12px_#F97316]' },
  moderate: { color: '#EAB308', label: 'MODERATE', glow: '' },
};

// Score → tier thresholds
scoreToTier(score: number): SeverityTier
// >= 75 → 'critical'
// >= 50 → 'urgent'
// < 50  → 'moderate'
```

Always use `SEVERITY[incident.tier].color` for severity-related coloring. Never hardcode `#EF4444` inline.

### Key CSS Animations (defined in `globals.css`)
```css
@keyframes crisis-pulse   /* Expanding ring on critical map pins */
@keyframes signal-enter   /* Slide-in + orange flash for new feed cards */
@keyframes breathe        /* Slow opacity pulse for empty states */
@keyframes availability-pulse /* Soft ring pulse on available volunteer markers */
@keyframes dispatch-step  /* Pop animation for dispatch tracker steps */
@keyframes glow-pulse     /* Pulsing box-shadow for Crisis Mode button */
```

---

## 5. Data Models (`lib/types.ts`)

These are the canonical TypeScript interfaces. The entire app is typed against these. The Firebase database, mock data, and all component props must match these exactly.

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
  id: string;               // Format: "incident_001" or Firebase push key
  locationRaw: string;      // Human-readable location, e.g. "Kareli village — near Nashik"
  coordinates: Coordinates; // Used for map pin placement
  severityScore: number;    // 0–100 integer
  tier: SeverityTier;       // Derived from severityScore via scoreToTier()
  needTypes: string[];      // e.g. ['evacuation', 'rescue', 'medical', 'food', 'water', 'shelter']
  vulnerableGroups: string[]; // e.g. ['elderly', 'children', 'pregnant']
  affectedCount: number;    // Estimated people impacted
  accessConstraints: string; // Road blocks, hazards, route notes
  status: IncidentStatus;
  signalCount: number;      // Number of raw field signals fused into this incident
  confidence: number;       // Gemini AI confidence score: 0.0–1.0
  signalType: SignalType;   // Type of the triggering signal
  languageDetected: string; // e.g. 'Hindi', 'Marathi', 'English'
  createdAt: string;        // ISO 8601 timestamp
  updatedAt: string;        // ISO 8601 timestamp
}

interface Volunteer {
  id: string;               // Format: "vol_001"
  name: string;
  phone: string;            // Indian format: "+91XXXXXXXXXX"
  skills: string[];         // See skill taxonomy below
  languages: string[];      // ISO 639-1 codes: ['HI', 'MR', 'EN', 'GU']
  coordinates: Coordinates; // Current location (GPS or last known)
  isAvailable: boolean;
  lastSeen: string;         // ISO 8601 timestamp
  ngoId: string;            // Which NGO they belong to
  dispatchCount: number;    // Lifetime dispatch count
  avatarUrl?: string;       // Optional profile image URL
}

interface VolunteerMatch {
  volunteer: Volunteer;
  distanceKm: number;       // Straight-line distance from incident
  skillMatchScore: number;  // 0–100, calculated by matching algorithm
}

interface Dispatch {
  id: string;
  incidentId: string;
  volunteerId: string;
  status: DispatchStatus;
  dispatchedAt: string;     // ISO 8601
  confirmedAt?: string;
  estimatedEta?: number;    // Minutes
}

interface Signal {
  id: string;
  incidentId?: string;      // Linked incident (assigned after Gemini fusion)
  signalType: SignalType;
  rawText?: string;
  extractedJson?: Partial<Incident>; // Gemini's parsed output
  receivedAt: string;
  telegramMessageId?: string;
}
```

### Volunteer Skill Taxonomy
Valid values for `Volunteer.skills[]`:
```
flood_rescue, navigation, medical, first_aid, trauma_support,
evacuation_coord, driving_4x4, logistics, hazmat, community_liaison
```

Valid values for `Incident.needTypes[]`:
```
rescue, medical, evacuation, food, water, shelter, hazmat
```

The `needTypes[]` → `skills[]` mapping used by the matching algorithm in `lib/mock/volunteers.ts`:
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

The single React Context that connects all three dashboard panels. Wrap with `<DashboardProvider>` at the root layout level. Consume with `useDashboard()` hook.

```typescript
interface DashboardState {
  // --- Incident selection ---
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;

  // --- Map layer control ---
  activeLayer: 'incidents' | 'volunteers' | 'gaps';
  setActiveLayer: (layer: 'incidents' | 'volunteers' | 'gaps') => void;

  // --- UI modes ---
  crisisMode: boolean;
  setCrisisMode: (active: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // --- Search ---
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // --- Map imperative control ---
  panToCoordinates: (lat: number, lng: number) => void;
  registerMapPan: (fn: (lat: number, lng: number) => void) => void;
  // GoogleCrisisMap calls registerMapPan() on mount to register its flyTo handler.
  // Any component can then call panToCoordinates() to move the map.

  // --- Volunteer radar (dispatch context) ---
  selectedVolunteerId: string | null;
  setSelectedVolunteerId: (id: string | null) => void;
  // When set, the selected volunteer's map pin appears on the 'incidents' layer,
  // letting coordinators see both the incident and volunteer location simultaneously.
}
```

---

## 7. The Map Engine (`GoogleCrisisMap.tsx`) — Architecture Deep Dive

This is the most complex file. Understand it fully before touching it.

### Why Not `@vis.gl/react-google-maps`?
The library is in the `package.json` but the map is **not using it** as the base component. Instead, the Google Maps API is loaded manually via a `<script>` tag injected into `document.head`. This was necessary to implement a custom `OverlayView` class (for tactical markers) without dealing with the imperative/declarative mismatch.

### Script Loading Pattern
```typescript
// A window callback signals React when Google Maps API is fully loaded.
window.__mapsCallbackReady = () => setMapsLoaded(true);
// The script tag appended to document.head uses &callback=__mapsCallbackReady
// This prevents the "Map is not a constructor" race condition.
```

### Deck.gl Heatmap — Key Decisions
- Uses `HeatmapLayer` from `@deck.gl/aggregation-layers` (NOT the deprecated `google.maps.visualization.HeatmapLayer`).
- Wrapped in `GoogleMapsOverlay` from `@deck.gl/google-maps`, operating in **raster overlay mode**.
- This means it renders as a canvas on top of the raster Google Map with **no Vector MapID required**.
- The custom `DARK_MAP_STYLE` JSON array (inline styles) applies to the underlying map.
- Heatmap color stops: Blue (#0000FF) → Emerald (#10B981) → Lime (#84CC16) → Yellow (#EAB308) → Orange (#F97316) → Red (#EF4444) → Dark Red (#7F1D1D).

### Custom Marker System (OverlayView pattern)
Incident pins and volunteer badges are plain DOM elements managed by a custom class that extends `google.maps.OverlayView`. The class is created inside the component using `createOverlayClass()` — a `useCallback` that returns the constructor. Instances are tracked in `overlaysRef.current[]` and cleared/rebuilt on every render cycle via `clearOverlays()`.

### Layer Rendering Logic
```
activeLayer === 'incidents'  →  Render incident pins + Deck.gl heatmap
                              →  If selectedVolunteerId is set, also render that one volunteer's pin
activeLayer === 'volunteers' →  Render all volunteer pins (neon badges)
activeLayer === 'gaps'       →  Render gap zone circles
```

### Volunteer Marker Styling (current implementation)
Available volunteers: 34px circle, `background: rgba(14,165,233,0.85)`, white initials text, `border: 2px solid #38bdf8`, outer neon cyan glow via `box-shadow`.
Deployed volunteers: same size, slate-grey color scheme, no glow.

---

## 8. Volunteer Matching Algorithm (`lib/mock/volunteers.ts → getVolunteerMatches()`)

```typescript
function getVolunteerMatches(
  incidentLat: number,
  incidentLng: number,
  needTypes: string[]
): VolunteerMatch[]
```

**Algorithm:**
1. Filter `MOCK_VOLUNTEERS` to `isAvailable === true` only.
2. Compute straight-line distance: `distanceKm = sqrt(dLat² + dLng²) * 111`.
3. Map each `needType` to required skill tags using the skill taxonomy.
4. Count how many of the volunteer's skills match the required skills.
5. `skillMatchScore = (matched / required) * 100`, capped at 100. If no required skills, default to 50.
6. Sort by composite score: `skillScore * 0.6 + proximityScore * 0.4`.
7. Return top 5 matches.

---

## 9. Dashboard Layout Rules

The three-panel shell is `h-screen overflow-hidden grid grid-cols-[280px_1fr_320px]`. These rules are non-negotiable:

- **NEVER** put `overflow: scroll` or `overflow: auto` on `<body>`, `<html>`, or the outer grid wrapper.
- **Only** the `SignalFeed` in LeftPanel and the RightPanel content area use `overflow-y-auto`.
- The Center panel (`CenterPanel`) is `relative h-screen overflow-hidden` — the map fills it absolutely.
- The `z-index` stack on the map: Map tiles (z:0) → Deck.gl canvas (z:1) → Custom OverlayView markers (z:10–500) → MapToolbar (z:1000) → Coordinate display (z:400).

### Responsive Behavior (not yet implemented — target state)
```
≥1280px → Full three-panel grid (current implementation)
768–1279px → LeftPanel collapses to icon rail; RightPanel becomes bottom drawer
<768px → Single column with bottom tab nav: Map / Feed / Dispatch
```

---

## 10. Authentication

Auth is **UI-only in the prototype**. No real auth backend is connected.

- `LoginForm.tsx` and `SignupForm.tsx` validate with `react-hook-form` + `zod`.
- On submit: 1.2 second simulated loading delay → redirect to `/dashboard`.
- All auth logic is intentionally ephemeral. When wiring real auth, replace the `onSubmit` handlers.
- The planned backend is **Firebase Authentication** (email/password + Google OAuth).

---

## 11. Backend Integration Points (Not Yet Implemented)

This section documents exactly where to wire up the real backend.

### A. Firebase Realtime Database

**File to modify:** `lib/firebase.ts`

Currently exports only `export const isMockMode = true;`. Replace with:
```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue, push, set };
export const isMockMode = false;
```

**Firebase database tree:**
```
/traan/
├── incidents/{incidentId}     → Incident object
├── volunteers/{volunteerId}   → Volunteer object
├── dispatches/{dispatchId}    → Dispatch object
└── signals/{signalId}         → Signal object
```

### B. Real-Time Incident Listener

**File to modify:** `lib/hooks/useIncidents.ts`

Replace the `setTimeout` mock with:
```typescript
import { db, ref, onValue } from '@/lib/firebase';

const incidentsRef = ref(db, 'traan/incidents');
const unsubscribe = onValue(incidentsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const list = Object.entries(data).map(([id, val]) => ({
      id,
      ...(val as Omit<Incident, 'id'>),
    }));
    setIncidents(list.sort((a, b) => b.severityScore - a.severityScore));
  }
  setLoading(false);
});
return () => unsubscribe();
```

### C. Volunteer Listener

**File to modify:** `lib/hooks/useVolunteers.ts`

Same pattern as above, path: `traan/volunteers`.

### D. Dispatch Action

**File to modify:** `components/dashboard/RightPanel/DispatchPanel.tsx`

Replace `handleDispatch()` body with a `push()` call to `traan/dispatches/` and then update the incident's status and volunteer's `isAvailable` to `false`.

### E. PWA Service Worker

**File to modify:** `next.config.mjs`

Uncomment and wire up `next-pwa`:
```javascript
import withPWA from '@ducanh2912/next-pwa';
const config = withPWA({ dest: 'public', register: true, skipWaiting: true });
export default config({ reactStrictMode: true });
```

---

## 12. Environment Variables

```env
# Required — Google Maps JavaScript API (Maps API must be enabled)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Required when Firebase is connected
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

Provide real values in `.env.local` (git-ignored). Never commit actual keys. See `.env.example` for the public template.

---

## 13. What's Working Right Now vs. What's Stubbed

| Feature | Status | Notes |
|---|---|---|
| Landing page | ✅ Complete | All four sections implemented |
| Auth UI (Login + Signup) | ✅ Complete | Mock redirect only, no real auth |
| Dashboard three-panel layout | ✅ Complete | Desktop only (1280px+) |
| Signal feed (left panel) | ✅ Complete | Reads from mock data |
| Crisis stats counters | ✅ Complete | Active/Deployed/Gaps from mock |
| Google Maps dark mode | ✅ Complete | Custom inline JSON style |
| Deck.gl GPU heatmap | ✅ Complete | Multi-stop gradient, no deprecation warnings |
| Incident map pins | ✅ Complete | Custom OverlayView, severity-colored |
| Volunteer map badges | ✅ Complete | Neon cyan glow badges, initials |
| Volunteer radar on dispatch | ✅ Complete | Triggered by selectedVolunteerId in context |
| MapToolbar layer switching | ✅ Complete | Incidents / Volunteers / Gaps |
| Crisis Mode toggle | ✅ Complete | Red pulsing button, UI state only |
| Incident detail (right panel) | ✅ Complete | Full metadata display |
| Volunteer match list | ✅ Complete | Algorithm-ranked, shows on incident select |
| Dispatch flow (simulated) | ✅ Complete | Sent → Confirmed → En Route animation |
| Volunteer profile page | ✅ Complete | Mock data |
| Real Firebase connection | ❌ Stubbed | See Section 11A-C |
| Real-time incident updates | ❌ Stubbed | See Section 11B |
| Real dispatch to volunteer | ❌ Stubbed | See Section 11D |
| Mobile responsive layout | ❌ Not built | Target: bottom tab nav on <768px |
| PWA service worker | ❌ Not activated | See Section 11E |
| Reports page | ❌ Placeholder | `app/dashboard/reports/page.tsx` is empty |
| Auth with Firebase Auth | ❌ Not built | Replace onSubmit in auth forms |

---

## 14. Rules for Agents and Developers

1. **TypeScript strict.** `tsconfig.json` has `"strict": true`. The ONLY documented exception is `(process as any).env` in `GoogleCrisisMap.tsx` (line ~55) to bypass a false-positive from the IDE's Node.js type inference.

2. **Design system first.** Before writing any JSX, identify which CSS token or Tailwind class to use. Never use arbitrary colors like `text-[#EF4444]` — use `text-critical`.

3. **Panel overflow contract.** The outer dashboard grid must remain `overflow-hidden`. Any new panel or widget that needs scroll must use `overflow-y-auto` internally, not on the wrapper.

4. **Marker lifecycle.** When adding new map elements to `GoogleCrisisMap.tsx`, always push them to `overlaysRef.current[]` and ensure `clearOverlays()` is called at the start of the render `useEffect`. Leaking overlays will cause ghost markers.

5. **No new dependencies without reason.** The package.json is deliberately minimal. Before installing anything, check if it can be done with what is already installed.

6. **Animations via transform/opacity only.** Never animate `width`, `height`, `top`, `left`, or `margin`. Use `transform` and `opacity` for all animations to maintain 60fps on low-end devices.

7. **Geography context.** All mock data, incident locations, and test coordinates are in **Maharashtra, India** (lat ~18–21, lng ~72–75). Any new mock data should follow this geographic convention.

8. **Signal feed cards must use the animation.** Any new feed card component must apply the `signal-enter` CSS keyframe on mount, and the left border must be colored by `SEVERITY[incident.tier].color`.

---

*Google Solutions Challenge 2026*