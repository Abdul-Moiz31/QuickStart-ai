# 08 — Visitor Identity & CRM Sync

**Type:** Integrations  
**Priority:** Medium  
**Effort:** Medium  

---

## Problem

Visitors are anonymous unless they voluntarily provide their name and email (via lead capture). Businesses that run authenticated web apps (SaaS, e-commerce) already know who is logged in — there is no way to pass that identity to QuickStart AI. Additionally, captured leads are delivered via webhook but there is no native sync to CRMs like HubSpot, Salesforce, or Pipedrive.

## User Story

> As a SaaS founder, I want my support chatbot to know which logged-in user it is talking to — so it can personalize answers and create a HubSpot contact automatically when a lead is captured.

## Part A: Visitor Identity (Signed Identity Token)

### Problem

The widget can accept `visitorName` and `visitorEmail` props, but these are sent in plaintext from the browser. A malicious user could impersonate any email. For authenticated apps this needs to be cryptographically verified.

### Design

1. Business generates a **signed identity JWT** server-side using their project's `clientSecret`:
   ```ts
   const token = jwt.sign(
     { name: "Alice Smith", email: "alice@company.com", userId: "usr_123" },
     clientSecret,
     { expiresIn: "1h" }
   );
   ```
2. Widget is initialized with `identityToken={token}` prop.
3. API verifies the JWT on `POST /api/v1/chat/session` and `POST /api/v1/chat/message`.
4. Verified identity is stored on the ChatSession and used in lead/handoff payloads.

### Widget changes

```tsx
<ChatBot
  clientId="qs_..."
  identityToken={signedToken}  // new optional prop
/>
```

### API changes

`requireClient` middleware already validates `clientId`/`clientSecret`. Add:
- Verify `identityToken` JWT against the stored `clientSecretHash` (or a dedicated identity HMAC secret)
- Attach verified `visitorName`, `visitorEmail`, `visitorUserId` to the session

### Documentation

Add a "Visitor Identity" section to the embed docs showing server-side token generation in Node.js, Python, PHP.

---

## Part B: CRM Sync Integrations

### Problem

Lead capture fires a webhook event but connecting it to HubSpot, Salesforce, or Pipedrive requires the business to build their own Zapier/Make automation or custom webhook handler.

### Design

Add two new native integrations to the existing `IntegrationConnection` system:

**HubSpot**
- Auth: OAuth 2.0 (HubSpot OAuth app) or Private App token
- On `lead.captured` event: create/update a HubSpot Contact with `firstname`, `lastname`, `email`, `phone`, and a note with the conversation summary
- On `human.handoff` event: create a HubSpot Conversation or Deal in "Needs Attention" stage

**Pipedrive**
- Auth: API token (stored encrypted)
- On `lead.captured`: create a Person + Lead in Pipedrive
- On `human.handoff`: create a Deal with "New" stage

### Implementation

The existing `packages/events/src/deliver/` pattern (see `slack.ts`, `discord.ts`) is the right model. Add:
- `packages/events/src/deliver/hubspot.ts`
- `packages/events/src/deliver/pipedrive.ts`

The `IntegrationConnection.provider` enum gets `"hubspot"` and `"pipedrive"` variants.

### Dashboard UI

New integration cards in Notifications → Integrations:
- HubSpot: "Connect HubSpot" → OAuth flow
- Pipedrive: "Connect Pipedrive" → API key input

## Affected Packages

| Package | Change |
|---------|--------|
| `apps/api` | Identity JWT verification in `requireClient` |
| `packages/widget-react` | `identityToken` prop |
| `packages/widget-vanilla` | `data-identity-token` attribute |
| `packages/events` | HubSpot + Pipedrive deliver handlers |
| `apps/web` | HubSpot/Pipedrive integration cards |
| `packages/shared` | Updated integration provider enum |

## Acceptance Criteria

**Identity**
- [ ] Widget initialized with `identityToken` sets verified name/email on session
- [ ] Tampered or expired tokens are rejected (401)
- [ ] Visitor with valid identity token bypasses the "enter your email" lead capture prompt

**CRM Sync**
- [ ] `lead.captured` event creates a HubSpot Contact within 10s
- [ ] `lead.captured` event creates a Pipedrive Person + Lead within 10s
- [ ] CRM credentials stored encrypted, never returned in plaintext
- [ ] Failed deliveries are retried (uses existing webhook retry BullMQ queue)

## Open Questions

- Should identity tokens support custom metadata fields (e.g., plan tier, account age) to enable personalized bot responses?
- Salesforce as a third CRM target? (Much heavier OAuth setup)
- Should the bot have access to the visitor's identity context to personalize answers (e.g., "Since you're on the Pro plan, you can...")?
