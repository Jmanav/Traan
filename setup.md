# Traan — Local Development Setup (Windows)

## Prerequisites

### 1. Install PostgreSQL 15 with PostGIS

1. Download the PostgreSQL 15 installer from https://www.postgresql.org/download/windows/
2. Run the installer. When prompted, also select **Stack Builder** to install PostGIS.
3. After PostgreSQL installs, Stack Builder will launch — select **Spatial Extensions > PostGIS** and install it.
4. Default install path: `C:\Program Files\PostgreSQL\15\`
5. Add PostgreSQL bin to your PATH (if the installer didn't):
   ```powershell
   $env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
   ```

### 2. Create the database and enable PostGIS

Open PowerShell and run:

```powershell
psql -U postgres
```

Inside psql:

```sql
CREATE DATABASE traan;
\c traan
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
\q
```

> If you want a dedicated user instead of `postgres`:
> ```sql
> CREATE USER traan WITH PASSWORD 'traan';
> GRANT ALL PRIVILEGES ON DATABASE traan TO traan;
> ```
> Then update `DATABASE_URL` in `.env` accordingly.

---

## Python Environment

### 3. Create and activate virtual environment

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

> If you get an execution-policy error, run once:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### 4. Install dependencies

```powershell
pip install -r requirements.txt
```

---

## Environment Variables

### 5. Configure .env

Copy the example and fill in your keys:

```powershell
Copy-Item .env.example .env
```

Edit `.env` — the minimum required to start the server:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/traan
GEMINI_API_KEY=your_key_here
```

All other keys (Maps, WhatsApp, Firebase, Pub/Sub) are only validated when
the feature that uses them is first called — they do not block server startup.

---

## Database Migrations

### 6. Run Alembic migrations

```powershell
alembic upgrade head
```

---

## Start the Server

### 7. Run FastAPI with uvicorn

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Verify

### 8. Check endpoints

```powershell
# Instant readiness check (no DB ping)
curl http://localhost:8000/ready

# DB health check
curl http://localhost:8000/health

# API docs
start http://localhost:8000/docs
```

Expected responses:
- `/ready` → `{"status":"ready"}`
- `/health` → `{"status":"ok"}` (or `{"status":"error","detail":"..."}` with HTTP 503 if DB is unreachable)
