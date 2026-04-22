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