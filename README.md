# Traan

**An AI-Powered Crisis Coordination Platform**  
Built for the **Google Solutions Challenge 2026** (SDG 11: Sustainable Cities & SDG 17: Partnerships).

## The Mission
During a crisis, response time is everything. But field data—voice notes, photos, SMS messages—takes hours to manually process into actionable directives. **Traan** eliminates this dead zone. 
It uses **Gemini AI** to consume multi-modal raw signals sent by victims and field workers over Telegram, automatically processes and grades the crisis severity, and visualizes it inside a highly interactive, tactical PWA for central NGO command.

---

## Core Features
- **AI Signal Fusion**: Users text via Telegram (Hindi/English text/voice). Gemini extracts severity, disaster type, and exact coordinates.
- **Geospatial Mapping**: Blistering fast visual map rendering using Deck.gl GPU rendering running on Google Maps, automatically mapping heatmaps relative to cluster signals.
- **Tactical UI/UX**: Designed for dark environments, ensuring critical data flashes organically without visually overwhelming the coordinator.
- **Algorithmic Dispatching**: Automatically ranks nearby available volunteers cross-referenced by their skillset and coordinates, providing you with optimal field deployments.
- **Real-Time Delivery**: Complete loop integration pushes Dispatch notifications onto the volunteer's phone natively. 

---

## Tech Stack

**Frontend (Client PWA)**
- **Framework**: Next.js 14
- **UI & Animation**: Tailwind CSS v3, pure CSS Keyframes, Lucide React (No generic UI libraries are used).
- **Mapping**: Google Maps Javascript API + Deck.gl (`GoogleMapsOverlay`).
- **Data Hooking**: Core Hooks polling by SWR.

**Backend (API + Microservices)**
- **Framework**: Python FastAPI
- **Model Processing**: Google Gemini API (`2.5-Flash`)
- **WebHooks**: Asynchronous Telegram Bot integrators
- **Geolocation Provider**: Nominatim (OpenStreetMap)

**Persistence & Database**
- **DB Engine**: PostgreSQL + PostGIS Extension
- **ORM Config**: SQLAlchemy + Alembic

---

## Getting Started & Setup

### Requirements:
- Node.js > 18.x
- Python 3.12+ 
- PostgreSQL correctly installed and running
- ngrok running globally

### Step 1: Database Setup 
Open a `psql` instance logged into postgres. Create a local database named `traan`:
```sql
CREATE DATABASE traan;
\c traan
CREATE EXTENSION IF NOT EXISTS postgis;
```
Now initialize the backend. From `Traan-backend/`:
```bash
python -m venv .venv
# Activate venv: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Mac)
pip install -r requirements.txt
pip install google-generativeai

# Push migrations to the DB
alembic upgrade head
```

### Step 2: Seed the DB
Seed the volunteers array for testing by loading the following into your `psql` shell connecting to `traan`:
```sql
INSERT INTO volunteers (name, phone, skills, language_capabilities, location, is_available, ngo_id)
VALUES
  ('Arjun Patil', '+919876543210', ARRAY['flood_rescue','navigation','first_aid'], ARRAY['HI','MR'], ST_SetSRID(ST_MakePoint(73.78, 19.99), 4326), true, NULL),
  ('Priya Sharma', '+919876543211', ARRAY['medical','trauma_support','first_aid'], ARRAY['HI','EN'], ST_SetSRID(ST_MakePoint(73.85, 19.85), 4326), true, NULL),
  ('Rahul Desai', '+919876543212', ARRAY['evacuation_coord','driving_4x4','logistics'], ARRAY['MR','HI'], ST_SetSRID(ST_MakePoint(74.10, 20.10), 4326), true, NULL);
```

### Step 3: Run the Backend & Ngrok
```bash
# In the Traan-backend folder:
uvicorn backend.main:app --reload

# In a separate terminal:
ngrok http 8000
```
Register the webhook provided by Ngrok to Telegram:
`curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<NGROK_URL>/webhook&secret_token=placeholder" -UseBasicParsing`

### Step 4: Run the UI App
```bash
# Inside sevasense/ folder:
npm install
npm run dev
```
Navigate to `localhost:3000` to interact with your central command hub.
