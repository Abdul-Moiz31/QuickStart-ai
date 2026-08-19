# 03 — Conversation Analytics Dashboard

**Type:** Dashboard / Intelligence  
**Priority:** High  
**Effort:** Medium  

---

## Problem

The `/dashboard/projects/:id/conversations` page shows individual chat sessions but gives no aggregated insight. Business owners cannot answer basic questions like:
- What are visitors asking most?
- How often does the bot fail (low confidence, escalations)?
- Is my knowledge base improving over time?
- When is chat volume highest?

The `UsageEvent` table in Postgres already records every `chat_message` with `meta.confidence` and `meta.toolsUsed`. This data exists — it just isn't surfaced anywhere.

## User Story

> As a business owner, I want a dashboard that shows me chat volume trends, top unanswered topics, escalation rate, and lead capture rate — so I know where to improve my bot.

## Proposed Design

### New API endpoint

`GET /api/v1/projects/:id/analytics?period=7d|30d|90d`

Returns aggregated stats computed from `UsageEvent` + `ProjectEvent` tables (no new tables needed):

```ts
{
  totalMessages: number,
  avgConfidence: "high" | "medium" | "low",
  confidenceBreakdown: { high: number, medium: number, low: number },
  escalationRate: number,           // % of sessions that triggered escalate_to_human
  leadCaptureRate: number,          // % of sessions that triggered capture_lead
  dailyVolume: { date: string, count: number }[],  // for sparkline chart
  topToolsUsed: { tool: string, count: number }[],
  unansweredCount: number,          // sessions where confidence was "low" on all messages
  avgMessagesPerSession: number,
}
```

### Dashboard page: `/dashboard/projects/:id/analytics`

**Metrics row (top)**
- Total conversations this period
- Avg confidence score (color-coded: green/yellow/red)
- Escalation rate %
- Lead capture rate %

**Volume chart**
- Daily message count as a bar/sparkline chart (7d / 30d toggle)

**Confidence breakdown**
- Donut chart: high / medium / low confidence split

**Top unanswered questions**
- Sessions where every bot message had `confidence: "low"` → extract the first user message as a proxy for the question
- Surface as a ranked list: "These topics your bot couldn't answer — consider adding knowledge"

**Tools used**
- Bar chart of which agent tools fired this period

### Sidebar nav

Add "Analytics" link between "Conversations" and "Knowledge" in the project layout sidebar.

### Implementation notes

- All queries are simple `GROUP BY` aggregations on existing Postgres tables — no new data pipeline needed
- Cache results in Redis for 10 minutes (keyed by `analytics:<projectId>:<period>`)
- Mobile-friendly: metrics row stacks vertically on small screens

## Affected Packages

| Package | Change |
|---------|--------|
| `apps/api` | `GET /api/v1/projects/:id/analytics` |
| `apps/web` | New `/dashboard/projects/:id/analytics` page, sidebar link |

## Acceptance Criteria

- [ ] Analytics page loads in < 1s (Redis cache for repeat visits)
- [ ] Volume chart shows correct daily breakdown for selected period
- [ ] Confidence breakdown matches the ratio seen in raw conversations
- [ ] "Top unanswered topics" list surfaces real low-confidence sessions
- [ ] Period toggle (7d / 30d / 90d) updates all charts without page reload
- [ ] Analytics visible on all plan tiers (data already exists)

## Open Questions

- Should we add a CSAT (customer satisfaction) rating prompt at the end of conversations to feed into analytics?
- Export to CSV for pro/enterprise?
- Weekly analytics email digest to the business owner?
