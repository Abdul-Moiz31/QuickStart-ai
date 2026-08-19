# 02 — Real-time Human Agent Inbox

**Type:** Core Product  
**Priority:** High  
**Effort:** Medium  

---

## Problem

`escalate_to_human` in `packages/rag/src/agent.ts` fires a webhook/Slack notification but the handoff ends there. There is no UI for a human agent to actually take over a live conversation and type replies to the visitor. The escalation is a dead end — the visitor is told "a human will follow up" but nothing happens in the product.

## User Story

> As a support agent, I want to receive escalated chats in a real-time inbox inside the dashboard, take over the conversation, and reply directly to the visitor — without switching to another tool.

## Proposed Design

### Architecture

Use **Redis pub/sub** (already in the stack on `packages/rag/src/cache.ts`) to broadcast messages on a channel keyed by `session:<sessionId>`.

```
escalate_to_human fires
  → session flagged humanPending: true in MongoDB
  → PUBLISH session:<id> {type:"escalation", ...}
  → Dashboard inbox subscribes via SSE: GET /api/v1/agent/inbox/stream
  → Agent clicks "Take over" → PATCH /api/v1/agent/sessions/:id/takeover
  → session.humanActive = true, session.agentId = req.user.id
  → Bot stops auto-replying (checked in chatRoutes before runAgenticRag)
  → Agent types → POST /api/v1/agent/sessions/:id/message
  → PUBLISH session:<id> {type:"agent_message", content}
  → Widget receives via SSE → renders "agent" bubble
  → Agent clicks "Hand back" → PATCH /api/v1/agent/sessions/:id/release
  → session.humanActive = false → bot resumes
```

### New API routes (`apps/api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/agent/inbox` | List pending and active escalations for the authed user's projects |
| GET | `/api/v1/agent/inbox/stream` | SSE stream — new escalations pushed in real time |
| PATCH | `/api/v1/agent/sessions/:id/takeover` | Mark session as human-active |
| POST | `/api/v1/agent/sessions/:id/message` | Send agent reply; publishes to Redis |
| PATCH | `/api/v1/agent/sessions/:id/release` | Hand back to bot |

### Dashboard page: `/dashboard/inbox`

- Left panel: list of escalated sessions (visitor name, last message, time since escalation, "Take over" button)
- Right panel: full conversation history + reply composer
- Red badge on sidebar nav item showing unread escalation count
- SSE stream auto-pushes new escalations without polling

### Widget changes (`packages/widget-core`)

- Subscribe to `GET /api/v1/chat/sessions/:id/stream` (SSE per session)
- When event `{type:"agent_message"}` arrives, render as a distinct "agent" bubble (different avatar, "Support Team" label)
- When `{type:"human_active"}` arrives, show status indicator: *"You're now connected to a support agent"*

### MongoDB schema additions (ChatSession)

```ts
humanPending:  boolean  // escalation triggered, not yet taken
humanActive:   boolean  // agent currently typing
agentId:       string?  // userId of agent who took over
escalatedAt:   Date?
takenOverAt:   Date?
releasedAt:    Date?
```

### Notification deeplink

The existing Slack/webhook payload for `human.handoff` gains a `inboxUrl` field:
```
https://app.quickstart.ai/dashboard/inbox?session=<id>
```

## Acceptance Criteria

- [ ] Escalated session appears in `/dashboard/inbox` within 2s of `escalate_to_human` firing
- [ ] Agent reply appears in visitor widget within 500ms
- [ ] Bot does not auto-reply while `humanActive = true`
- [ ] "Hand back to bot" resumes automated RAG responses
- [ ] Slack/webhook notification includes deeplink to inbox
- [ ] Unread badge on sidebar nav updates without page refresh
- [ ] Works across multiple browser tabs (Redis pub/sub ensures all open dashboards receive the event)

## Open Questions

- Should agent replies be stored in the same `messages[]` array on ChatSession with `role: "agent"`?
- Do we need a typing indicator ("Agent is typing…") in the widget?
- Should "take over" be exclusive (only one agent per session) or allow observers?
