# 04 — WhatsApp & SMS Channel Integration

**Type:** New Channel  
**Priority:** Medium  
**Effort:** Medium  

---

## Problem

Most SMBs communicate with customers primarily over WhatsApp. QuickStart AI only reaches visitors through a web widget. Businesses that already have a WhatsApp Business number cannot use their existing knowledge base to auto-answer messages without building a custom integration.

## User Story

> As a business owner, I want my WhatsApp Business number to automatically answer common customer questions using my QuickStart AI bot — so my team doesn't have to manually reply to every message.

## Proposed Design

### Architecture

Both WhatsApp (Meta Cloud API) and SMS (Twilio) follow the same inbound-webhook pattern:

```
Incoming WhatsApp/SMS message
  → POST /api/v1/channels/whatsapp  (or /sms)
  → HMAC signature verification
  → Look up project by phone number ID stored in ProjectCredential
  → Find or create ChatSession (source: "whatsapp" | "sms", externalId: wa_id or From)
  → runAgenticRag (unchanged)
  → Reply via Meta Messages API or Twilio Messages API
```

### ChatSession changes (MongoDB)

Add `source: "web" | "whatsapp" | "sms" | "voice"` and `externalId` (the WhatsApp `wa_id` or Twilio `From` number) to correlate follow-up messages to the same session.

### Credential storage

Channel credentials (Meta Phone Number ID + Access Token, or Twilio Account SID + Auth Token) stored encrypted in the existing `ApiCredential` / project settings pattern — same as BYOK LLM keys using `encryptSecret` in `apps/api/src/crypto.ts`.

### New API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/channels/whatsapp` | Meta webhook for inbound messages + verification GET |
| POST | `/api/v1/channels/sms` | Twilio webhook for inbound SMS |

### Dashboard: Channel setup UI

New section in Project Settings → "Channels":
- **WhatsApp**: paste Meta Phone Number ID and System User Access Token → test connection button → enable toggle
- **SMS**: paste Twilio credentials + from number → test → enable toggle
- Shows webhook URL to copy into Meta / Twilio dashboard

### Conversation list

Sessions from WhatsApp/SMS show a channel badge icon (WhatsApp green logo / SMS bubble). Filtering by channel.

### Typing indicator equivalent

WhatsApp supports "typing…" status via the Meta API — send it while RAG is running (< 3s) to avoid looking unresponsive.

### Rate limiting

WhatsApp Cloud API has a per-number message limit. Rate-limit outbound replies per `externalId` in Redis (same Redis sliding-window already used for chat messages).

## Affected Packages

| Package | Change |
|---------|--------|
| `apps/api` | New channel routes with signature verification |
| `packages/shared` | `source` enum, new event types `channel.whatsapp_message`, `channel.sms_message` |
| `packages/db` | `source`, `externalId` on ChatSession (Mongoose) |
| `apps/web` | Channel settings UI, channel badge in conversation list |

## Acceptance Criteria

- [ ] WhatsApp inbound message answered by RAG within 5s
- [ ] SMS inbound message answered within 5s
- [ ] Repeat messages from same WhatsApp number continue the same ChatSession
- [ ] Webhook signature verified before processing
- [ ] Conversation appears in dashboard with correct channel badge
- [ ] `escalate_to_human` sends the inbox notification with correct session deeplink
- [ ] WhatsApp typing indicator sent while RAG is running

## Open Questions

- Should we support rich WhatsApp messages (buttons, lists) for structured bot responses, or start with plain text only?
- Instagram DMs as a third channel (same Meta API, minimal extra work)?
- How do we handle multi-media inbound messages (images, voice notes) from WhatsApp users?
