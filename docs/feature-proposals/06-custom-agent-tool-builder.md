# 06 — Custom Agent Tool Builder

**Type:** Core Product / Platform  
**Priority:** Medium  
**Effort:** Large  

---

## Problem

The agent in `packages/rag/src/agent.ts` has exactly 5 hardcoded tools: `search_knowledge`, `get_project_faq`, `get_business_hours`, `escalate_to_human`, `capture_lead`. Businesses with unique workflows (e.g., "check order status by order number", "look up appointment slot", "fetch account balance") cannot add custom actions. They must build a full custom integration or give up and answer manually.

Competing products (Botpress, Voiceflow, Intercom Fin) allow custom tool/action definition as a first-class feature.

## User Story

> As a developer integrating QuickStart AI into my e-commerce store, I want to define a "check_order_status" tool that calls my backend API with an order number — so the bot can look up real order data during a conversation without me building a custom bot.

## Proposed Design

### Custom tool definition (dashboard)

A custom tool has:
- **Name** (snake_case, shown to the LLM planner)
- **Description** (plain English — the LLM uses this to decide when to call it)
- **HTTP method + URL** (the webhook endpoint to call)
- **Parameters** (a list of named fields the LLM should extract from the conversation before calling)
- **Response mapping** (JSONPath or simple key to extract from webhook response and return as tool output)
- **Auth header** (optional bearer token for the webhook)

Example:

```json
{
  "name": "check_order_status",
  "description": "Look up the status of a customer order when they provide an order number",
  "method": "POST",
  "url": "https://shop.example.com/api/order-status",
  "authHeader": "Bearer {{SECRET}}",
  "parameters": [
    { "name": "order_number", "description": "The order ID the customer mentioned", "required": true }
  ],
  "responseKey": "status"
}
```

### Runtime execution (in `packages/rag/src/agent.ts`)

`buildAgentTools()` is extended to accept `customTools: CustomTool[]` from the project config. For each:

```ts
{
  name: tool.name,
  description: tool.description,
  async execute(args) {
    const res = await fetch(tool.url, {
      method: tool.method,
      headers: {
        "Content-Type": "application/json",
        ...(tool.authHeader ? { Authorization: decryptSecret(tool.authHeaderEnc) } : {}),
      },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    const output = tool.responseKey ? String(data[tool.responseKey] ?? JSON.stringify(data)) : JSON.stringify(data);
    return { output };
  }
}
```

The LLM planner already handles dynamic tool lists — it receives the tool catalog as text. No planner changes needed.

### Security

- Webhook URL must pass `validateUrl()` (already in `packages/events/src/validate-url.ts`)
- Auth header value stored encrypted with `encryptSecret` (same as LLM keys)
- Execution timeout: 5s max
- Response body capped at 4 KB before passing to LLM context
- Tool execution rate-limited per project (10 calls/min per tool)
- Custom tools only allowed on pro/enterprise plan

### Database schema (Prisma)

```prisma
model CustomTool {
  id             String   @id @default(uuid()) @db.Uuid
  projectId      String   @db.Uuid
  project        Project  @relation(...)
  name           String
  description    String   @db.Text
  httpMethod     String   @default("POST")
  url            String
  authHeaderEnc  String?  @db.Text
  parameters     Json     @default("[]")
  responseKey    String?
  enabled        Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([projectId])
}
```

### Dashboard UI

New "Custom Tools" section in project tools page (below the built-in toggles):
- List of defined tools with enable/disable toggle
- "Add tool" modal with form fields
- "Test tool" button — sends a sample payload and shows raw response
- Secret auth token masked after save (same UX as API credentials)

## Affected Packages

| Package | Change |
|---------|--------|
| `packages/rag` | `buildAgentTools()` accepts `customTools[]`, executes via fetch |
| `apps/api` | CRUD routes for custom tools, load and pass to RAG |
| `packages/db` | `CustomTool` Prisma model |
| `packages/shared` | Zod schema for custom tool definition |
| `apps/web` | Custom tool builder UI |

## Acceptance Criteria

- [ ] Custom tool can be defined in dashboard with name, description, URL, parameters, auth header
- [ ] LLM planner selects the custom tool when appropriate based on description
- [ ] Tool is called via HTTP with extracted arguments from conversation
- [ ] Response is included in LLM context for answer generation
- [ ] Auth header is stored encrypted, never returned in plaintext to dashboard
- [ ] Tool execution timeout enforced (5s)
- [ ] Custom tools disabled on free plan (pro/enterprise only)
- [ ] "Test tool" sends a sample request and shows response inline

## Open Questions

- Should we support response transformation beyond a simple key lookup (e.g., a JSONPath expression or a small template)?
- Should custom tool calls appear in conversation analytics?
- How do we handle tool errors gracefully — tell the bot "the tool failed, apologize and offer escalation"?
