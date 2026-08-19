# 05 — Proactive Chat Triggers

**Type:** Widget / Conversion  
**Priority:** Medium  
**Effort:** Small  

---

## Problem

The current chat widget is 100% reactive — the visitor must click the bubble to start a conversation. Businesses have no way to prompt visitors at the right moment (e.g., after 30 seconds on a pricing page, or when the visitor is about to leave). Every high-converting chat product (Intercom, Drift, Crisp) has proactive triggers as a core feature.

## User Story

> As a business owner, I want my chatbot to automatically open and send a message to visitors who have been on my pricing page for 20 seconds — so I can capture them before they leave.

## Proposed Design

### Trigger types (configured in dashboard)

| Trigger | Description |
|---------|-------------|
| `time_on_page` | Open after N seconds on the current page |
| `exit_intent` | Open when mouse moves toward browser chrome (desktop) |
| `scroll_depth` | Open when visitor scrolls past X% of page |
| `url_match` | Open when current URL matches a pattern (e.g. `/pricing`, `/checkout`) |
| `idle` | Open when visitor has been inactive for N seconds |

Triggers can be combined (e.g., "on /pricing AND after 15 seconds").

### Proactive message

Each trigger has a configurable opening message (e.g., *"Need help choosing a plan? I can compare them for you."*). The message appears as an assistant bubble without the visitor doing anything — widget auto-opens.

### Widget implementation (`packages/widget-core`, `packages/widget-vanilla`, `packages/widget-react`)

```ts
// New config field on widget init
triggers: [
  { type: "time_on_page", seconds: 20, message: "Can I help you today?" },
  { type: "url_match", pattern: "/pricing", message: "Questions about pricing?" },
  { type: "exit_intent", message: "Before you go — any questions I can answer?" }
]
```

1. Widget receives `triggers[]` from `GET /api/v1/chat/config` (add to response)
2. Widget evaluates triggers client-side (no server round-trip needed)
3. When trigger fires → auto-open widget → inject the proactive message as an assistant bubble in the UI (not sent to the API — it's cosmetic until the visitor replies)
4. Once visitor replies, a normal session is created and the conversation proceeds

### Dashboard: Trigger setup UI

New section on Tools page (or a dedicated "Triggers" sub-page):
- Add/remove trigger rules
- Select trigger type, configure parameters, write the opening message
- Preview: see which message fires on which page
- Enable/disable per project

### New project settings fields (Prisma + schema)

```prisma
proactiveTriggers  Json  @default("[]")
```

Stored as an array of trigger config objects, returned via `GET /api/v1/chat/config`.

### Deduplication

Widget tracks trigger fires in `sessionStorage` — a trigger that already fired in this browser session does not fire again (even across page navigation).

## Affected Packages

| Package | Change |
|---------|--------|
| `packages/widget-core` | Trigger evaluation engine |
| `packages/widget-react` | Expose `triggers` prop |
| `packages/widget-vanilla` | Parse `data-triggers` JSON attribute |
| `apps/api` | Add `proactiveTriggers` to `/api/v1/chat/config` response |
| `packages/shared` | `proactiveTriggers` Zod schema |
| `packages/db` | `proactiveTriggers Json` on Project model |
| `apps/web` | Trigger configuration UI |

## Acceptance Criteria

- [ ] Widget auto-opens and shows proactive message when time_on_page trigger fires
- [ ] Exit intent trigger works on desktop (mouseleave on document)
- [ ] URL match trigger evaluates against current `window.location.pathname`
- [ ] Trigger fires at most once per session (sessionStorage dedupe)
- [ ] Proactive message appears as assistant bubble; visitor reply starts a normal session
- [ ] Triggers are configurable in dashboard and saved per project
- [ ] Trigger config is delivered via `GET /api/v1/chat/config` (no additional widget config needed)

## Open Questions

- Should the proactive message be sent to the API immediately (to appear in conversation history) or only after the visitor replies?
- Mobile exit-intent alternative (scroll-up behavior on mobile)?
- Should triggers have a daily frequency cap per visitor (via localStorage)?
