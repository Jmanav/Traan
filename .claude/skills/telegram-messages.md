# Telegram Message Conventions for Traan

- All outbound messages must go through /backend/services/telegram_sender.py
- Never send Telegram messages directly from agent files
- Task card must include: incident location, volunteer role, approach route, ETA, confirm instruction
- Confirm instruction always: "Reply 1 to confirm, 2 to decline"
- Check-in message must reference the specific incident so volunteer knows which crisis
- Follow-up message (after 8 min no response) must be shorter and more urgent than task card
- Log every outbound message to events table: volunteer_id, incident_id, message_type, timestamp
- Never send more than 3 messages to the same volunteer for the same incident
- If volunteer replies anything other than 1 or 2, treat as unresponsive after 13 total minutes
- Use sendMessage endpoint: POST https://api.telegram.org/bot{TOKEN}/sendMessage with chat_id and text
- Token loaded via config.get_telegram_bot_token() — never hardcoded
