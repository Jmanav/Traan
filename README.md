# SevaSense: Tactical Crisis Coordination PWA

SevaSense is a high-performance, professional-grade Progressive Web App (PWA) designed for NGOs and disaster response teams. It provides real-time situational awareness, resource coordination, and incident management through a "tactical-first" interface. By combining Google’s mapping infrastructure with advanced WebGL visualization, SevaSense turns chaotic field data into actionable intelligence.

## The Core Vision
In a crisis, information overload is as dangerous as a lack of information. SevaSense was built to solve the "noise" problem. We use a military-inspired tactical dark theme to reduce eye strain during long shifts and prioritize high-contrast visual cues (red alert zones, neon status badges) so dispatchers can make split-second decisions without hunting for data.

## Tech Stack
We’ve stayed strictly within a high-performance, modern stack to ensure the app is both fast and stable:

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Lucide React for UI components
- **Mapping:** Google Maps JavaScript API 
- **Visualization engine:** Deck.gl (GPU-accelerated WebGL layers for heatmaps)
- **State Management:** React Context API (Hoisted global crisis state)
- **Mock Engine:** Custom-built algorithm for volunteer-to-incident matching (Skill matches + Haversine distance)

## Key Features

### 1. The Global Crisis Map
- **Tactical Dark Mode:** A customized, high-contrast map style designed for legibility and aesthetic excellence.
- **GPU Heatmaps:** Using Deck.gl to render ultra-smooth, multi-stop gradients that blend geographically—exactly like professional GIS thermal maps.
- **Zero-ID Bypassing:** Custom `OverlayView` implementation that allows advanced tactical pins without requiring Google Cloud Map IDs or Vector maps.

### 2. Signal Management (SIG Feed)
- **Incident Prioritization:** Real-time feed of field signals (SIGs) categorized by severity (Critical, High, Medium, Low).
- **Deep Detail Overlays:** Instant access to victim counts, confidence scores, and specific resource needs (Food, Medical, Water) without losing map context.

### 3. Volunteer Dispatch & Matching
- **Smart Matching:** An integrated algorithm that ranks volunteers based on their specific skills (e.g., flood rescue, medical) and their real-time distance from an active SIG.
- **Visual Radar:** Selecting a volunteer in the dispatch panel triggers a "radar ping" on the map, showing exactly where they are relative to the incident.

### 4. Gap Analysis
- Dynamic visualization of "service gaps"—areas with high incident clusters but low volunteer density—allowing NGOs to redeploy resources to where they are needed most.

## Setup & Installation

### Prerequisites
- Node.js (Latest LTS recommended)
- A Google Maps API Key (with Maps JavaScript API enabled)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd sevasense
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and add your API key:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## PWA Support
SevaSense is fully optimized for mobile deployment. It can be "installed" on iOS or Android devices for full-screen field use. It features responsive layouts that transition the tactical dashboard into a bottom-sheet driven mobile interface.

---
**Built for the field. Built for impact.**