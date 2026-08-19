# 07 — Knowledge Gap Detection

**Type:** Intelligence / Dashboard  
**Priority:** Medium  
**Effort:** Small  

---

## Problem

Business owners add knowledge and assume the bot is working. But there's no feedback loop. When the bot answers with low confidence or escalates to a human, nothing surfaces that to the owner as "here's a gap in your knowledge base — fill it." The eval system (`packages/eval`) measures quality against a golden set but doesn't catch real-world gaps from live traffic.

## User Story

> As a business owner, I want to see a list of real visitor questions my bot couldn't answer well — with a one-click button to add the answer to my knowledge base.

## Proposed Design

### Gap detection logic

A conversation is a "knowledge gap" when:
- Any bot message had `confidence: "low"` AND no `escalate_to_human` was explicitly called, OR
- `escalate_to_human` was called with `reason: "insufficient knowledge base coverage"`

The first user message in the session is the proxy for the topic the visitor was asking about.

### Data source

`UsageEvent.meta.confidence` is already stored per message. `ProjectEvent` records all `human.handoff` events with their payload. No new data collection needed.

### New API endpoint

`GET /api/v1/projects/:id/knowledge-gaps?limit=20`

Returns:
```ts
[
  {
    sessionId: string,
    question: string,       // first user message of the session
    date: string,
    confidence: "low",
    sessionCount: number,   // how many sessions asked something similar (fuzzy-grouped)
  }
]
```

Grouping similar questions: compute cosine similarity between embeddings of first-user-messages of low-confidence sessions (reuse `packages/rag` embeddings client). Questions within 0.85 similarity are grouped and the most frequent phrasing is shown.

### Dashboard UI

New "Knowledge Gaps" section inside the Knowledge page (or as a tab):

```
⚠️  12 unanswered questions this week

  "What is your return policy for digital products?"     ×5 sessions
  [Add answer →]

  "Do you have a mobile app?"                            ×3 sessions
  [Add answer →]

  "Can I get an invoice in a different currency?"        ×2 sessions
  [Add answer →]
```

"Add answer →" opens the existing FAQ editor pre-filled with the question, cursor in the answer field.

### Weekly digest (optional, stretch)

Send a weekly email to the project owner listing top 5 knowledge gaps. Uses the existing notification/webhook infrastructure.

## Affected Packages

| Package | Change |
|---------|--------|
| `apps/api` | `GET /api/v1/projects/:id/knowledge-gaps` |
| `packages/rag` | Expose embeddings client for gap grouping |
| `apps/web` | Knowledge gaps UI in Knowledge page |

## Acceptance Criteria

- [ ] Low-confidence sessions from the past 30 days are surfaced on the knowledge gaps page
- [ ] Questions are deduplicated/grouped by semantic similarity
- [ ] "Add answer" pre-fills the FAQ editor with the visitor's question
- [ ] Gaps older than 90 days are not shown (focus on recent traffic)
- [ ] No new database tables required — uses existing `UsageEvent` and `ProjectEvent`

## Open Questions

- Should resolved gaps (where a matching FAQ was added after the date of the gap) be marked as resolved automatically?
- Show the full conversation alongside the gap question for context?
- Should gap detection also flag questions answered with low confidence even when not escalated?
