# 01 — Voice Calling Agent

**Type:** New Channel  
**Priority:** High  
**Effort:** Large  

---

## Problem

QuickStart AI only answers visitors through a web chat widget. A large share of business support volume arrives by phone. There is no way for a business to point an inbound phone number at the same knowledge base and agent tools that power their web chatbot.

## User Story

> As a business owner, I want inbound support calls to be answered automatically by my QuickStart AI bot — using the same FAQs and docs I already uploaded — so I don't miss calls when my team is unavailable.

## Proposed Design

### Channel flow

```
Inbound call (Twilio / Vapi)
  → speech-to-text (Twilio STT or Deepgram)
  → POST /api/v1/voice/message  (existing runAgenticRag, unchanged)
  → answer text
  → text-to-speech (ElevenLabs / Twilio TTS)
  → audio back to caller
```

### Key components

1. **`POST /api/v1/voice/inbound`** — Twilio webhook handler. Verifies `X-Twilio-Signature`. Returns TwiML with `<Gather>` to collect caller speech.
2. **`POST /api/v1/voice/message`** — Receives transcript from Gather callback. Runs `runAgenticRag` with `source: "voice"`. Returns TwiML `<Say>` with the answer.
3. **Escalation path** — when `escalate_to_human` fires, the bot says *"I'm connecting you to a team member"* and forwards the call to a configurable phone number using `<Dial>`.
4. **Call session in MongoDB** — same `ChatSession` document with `source: "voice"`, `callSid`, `duration` fields appended.
5. **Dashboard: Voice channel settings** — phone number field, TTS voice picker (male/female), escalation number, enable/disable toggle. Visible on pro/enterprise plan.
6. **Dashboard: Call log** — conversations list shows a phone icon badge for voice sessions. Transcript viewable like any chat session.

### New event types (in `packages/shared/src/events.ts`)

- `voice.call_started`
- `voice.call_ended` (includes duration, transcript length, confidence)
- `voice.escalated`

### Plan gating

| Plan | Voice minutes/day |
|------|-------------------|
| free | 0 (disabled) |
| pro | 120 min |
| enterprise | unlimited |

Add `voiceMinutesPerDay` to `PLAN_LIMITS` in `packages/shared/src/constants.ts`.

## Affected Packages

| Package | Change |
|---------|--------|
| `apps/api` | New `/api/v1/voice/*` routes, Twilio HMAC verification |
| `packages/shared` | New event types, plan limit field |
| `packages/db` | `source`, `callSid`, `duration` on ChatSession (Mongoose) |
| `packages/events` | Voice event delivery |
| `apps/web` | Voice channel settings UI, call badge in conversation list |

## Acceptance Criteria

- [ ] Inbound Twilio call is answered, transcribed, and the RAG answer is read back via TTS in < 4s
- [ ] Call is escalated with `<Dial>` when `escalate_to_human` fires
- [ ] Call transcript appears in the dashboard conversations view
- [ ] `voice.call_ended` event is delivered to configured webhooks/Slack
- [ ] Voice channel is disabled on the free plan
- [ ] Twilio webhook signature is verified before processing (HMAC-SHA1)

## Open Questions

- Support Vapi as an alternative to Twilio for businesses already using it?
- Should the bot introduce itself with a custom greeting before the first Gather?
- ElevenLabs for higher-quality TTS vs. Twilio's built-in (cost trade-off)?
