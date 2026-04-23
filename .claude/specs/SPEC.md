# Traan — Build Spec

## Goal
Build the agentic backend for Traan. The system must autonomously:
1. Receive WhatsApp webhook payloads (audio, image, text)
2. Extract structured crisis intelligence via Gemini multimodal
3. Store incidents in PostgreSQL with PostGIS geospatial columns
4. Reason over the situation via the Crisis Commander
5. Dispatch volunteers via WhatsApp task cards with approach routes
6. Monitor active deployments and replan without human input

## In Scope — Build This
- Signal Agent: webhook receiver, Gemini extraction, geocoding, corroboration
- Crisis Commander: Gemini reasoning loop, agent orchestration
- Triage Agent: conflict resolution, velocity detection, severity upgrade
- Dispatch Agent: PostGIS matching, task card delivery, confirmation loop with fallback
- Monitor Agent: heartbeat scheduler, drift detection, closure + report trigger
- FastAPI webhook endpoint for Meta WhatsApp verification + payload receipt
- PostgreSQL schema with PostGIS (incidents, signals, volunteers, dispatches, events, ngos)
- Firebase event firing on every incident state change
- Google Maps Geocoding integration in geo_service.py
- Google Maps Routes API integration in geo_service.py

## Out of Scope — Do Not Build Yet
- React frontend dashboard
- NDRF escalation API integration
- Auto-generated PDF incident report
- IVR phone fallback for feature phones
- Multi-tenancy / NGO onboarding flow

## Success Criteria
- A Hindi voice note POSTed to /webhook produces a structured incident in the DB within 15 seconds
- Dispatch Agent sends a WhatsApp task card without human intervention
- If volunteer is unresponsive for 8 minutes, system auto-dispatches next candidate
- All agent actions are logged to the events table with structured payload
- Crisis Commander reasoning output is readable in the events log

## Required Environment Variables 
are in .env file 