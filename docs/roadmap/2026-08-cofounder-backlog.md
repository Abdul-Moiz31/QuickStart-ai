# Co-founder product backlog — Aug 2026

Captured from co-founder review (Subtle Voice × QuickStart AI). Each section below is written as a **GitHub-issue-ready brief** — title, problem, proposal, and acceptance criteria. Abdul Moiz can paste these into GitHub Issues or pick them up sprint-by-sprint.

**Legend:** Priority = suggested order, not commitment. **Area** maps to codebase locations.

---

## Issue 1 — Onboarding: loading state on AI question generation

**Labels:** `onboarding`, `ux`, `dashboard`  
**Priority:** P0  
**Area:** `apps/web` onboarding flow, question-generation API

### Problem
When the platform generates onboarding questions for a business, the UI feels **stuck** — there is no visible progress inside the generate action. Users don’t know whether anything is happening.

### Proposal
- Add an **inline loader/spinner inside the “Generate” button** (and disable the button while running).
- Show a short status line under the button, e.g. “Researching your website…” → “Drafting questions…”.
- Handle failures with a clear retry path; never leave the button in a silent loading state.

### Acceptance criteria
- [ ] Generate button shows spinner + “Generating…” while the API call is in flight.
- [ ] Button is disabled during generation; re-enabled on success or error.
- [ ] Error state shows message + “Try again” without requiring a page refresh.
- [ ] Works on mobile-width dashboard layouts.

---

## Issue 2 — Onboarding: high-quality AI Q&A from company research + confirm before save

**Labels:** `onboarding`, `ai`, `knowledge`  
**Priority:** P0  
**Area:** onboarding API, RAG/LLM pipeline, `apps/web` onboarding UI

### Problem
Generated onboarding questions are generic and don’t include **suggested answers** grounded in the business’s website or company profile. Admins can’t **review and confirm** before questions are saved to the project.

### Proposal
1. **Research step** — Before generating questions, pull context from:
   - Business website URL (scrape/summary — see Issue 11)
   - Existing onboarding inputs (name, industry, description)
   - Platform defaults / FAQ templates where relevant
2. **Generation step** — Produce **question + suggested answer pairs** (not questions alone). Answers should cite or reflect researched content; mark low-confidence answers visually.
3. **Review step** — Present a **confirmation screen**:
   - Edit question text and answer text inline
   - Remove unwanted pairs
   - Regenerate single pair or full set
   - Explicit **“Save to project”** — nothing persists until confirmed

### Acceptance criteria
- [ ] API returns `{ question, suggestedAnswer, confidence? }[]` grounded in website/profile context.
- [ ] UI shows all pairs in an editable review list before save.
- [ ] Save is blocked until user clicks confirm; cancel discards draft.
- [ ] Saved pairs land in knowledge/onboarding store used by the chatbot.
- [ ] Empty or failed research degrades gracefully (manual entry still works).

---

## Issue 3 — Dashboard design revamp

**Labels:** `dashboard`, `design`, `ux`  
**Priority:** P1  
**Area:** `apps/web/src/app/dashboard`, `DashboardShell`, shared UI tokens

### Problem
The dashboard feels dated/inconsistent compared to the marketing site. Information density, spacing, and visual hierarchy need a cohesive pass.

### Proposal
- Align dashboard with **QuickStart UI** (clay + white, ink accents, Outfit typography).
- Standardize page headers, empty states, tables, and form panels.
- Improve responsive behavior for inbox, knowledge, and project switcher.
- Produce a short **design checklist** before shipping (see `.cursor/skills/quickstart-ui/SKILL.md`).

### Acceptance criteria
- [ ] All dashboard routes share consistent header, padding, and card patterns.
- [ ] No horizontal overflow on 375px viewport.
- [ ] Primary actions use ink buttons; secondary actions are clearly de-emphasized.
- [ ] Before/after screenshots attached to PR.

---

## Issue 4 — Apps section: investigate and fix broken or unclear behavior

**Labels:** `bug`, `dashboard`, `investigation`  
**Priority:** P1  
**Area:** TBD — needs reproduction notes from co-founder

### Problem
Something in the **“Apps”** area of the product is broken or confusing. Exact steps were not fully captured in the review — needs reproduction and scoping.

### Proposal
1. **Reproduce** with co-founder (screen recording or written steps).
2. Document expected vs actual behavior in this issue.
3. Fix or hide the feature until ready.

### Acceptance criteria
- [ ] Reproduction steps documented in issue comments.
- [ ] Root cause identified (UI bug, API error, stale route, etc.).
- [ ] Fix merged or feature flagged off with user-visible explanation.

---

## Issue 5 — Document upload via Cloudflare R2

**Labels:** `infrastructure`, `knowledge`, `storage`  
**Priority:** P1  
**Area:** `apps/api` knowledge routes, `apps/worker`, env config

### Problem
Document uploads are not backed by durable object storage suitable for production scale.

### Proposal
- Integrate **Cloudflare R2** (S3-compatible) for knowledge document blobs.
- Flow: presigned upload URL from API → client/worker uploads → metadata in Postgres → ingest worker processes from R2.
- Env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (optional).

### Acceptance criteria
- [ ] Upload stores file in R2; DB row references object key.
- [ ] Ingest worker reads from R2 and indexes as today.
- [ ] Delete document removes R2 object + DB + vectors.
- [ ] `.env.example` documented; local dev can use MinIO or R2 dev bucket.
- [ ] Max file size and MIME allowlist enforced at API.

---

## Issue 6 — Conversations & inbox UI redesign

**Labels:** `inbox`, `conversations`, `ux`  
**Priority:** P1  
**Area:** `apps/web/.../inbox`, `apps/web/.../conversations`, agent SSE

### Problem
Conversation history and the human-agent inbox need clearer layout, session context, and real-time feedback.

### Proposal
- **Inbox:** clearer pending vs active states, visitor identity chip, last message preview, assignee badge.
- **Conversations:** transcript readability, filters (date, handoff, confidence), export.
- Unify visual language between inbox takeover view and read-only conversation log.
- Mobile-friendly split view or stacked layout.

### Acceptance criteria
- [ ] Inbox list shows pending count, staleness, and visitor name/email at a glance.
- [ ] Active takeover view: transcript + reply box + release control without layout jump.
- [ ] Conversations page supports search/filter by date range.
- [ ] Real-time updates (new escalation, visitor message) without full page reload.

---

## Issue 7 — Settings hub: group Appearance, Notifications, Documentation, Custom events

**Labels:** `dashboard`, `navigation`, `settings`  
**Priority:** P1  
**Area:** `DashboardShell` nav, new `/dashboard/projects/[id]/settings/*` structure

### Problem
Too many top-level sidebar items. Appearance, notifications, documentation links, and custom events belong under a unified **Settings** area.

### Proposal
Move into **Project → Settings** (tabbed or sub-nav):
- Appearance (widget theme, colors, position)
- Notifications (webhooks, Slack, email destinations)
- Documentation / embed docs links (internal help, not public docs site)
- Custom events

### Acceptance criteria
- [ ] Single “Settings” entry in sidebar with sub-sections.
- [ ] Old routes redirect (301 or client redirect) for bookmarks.
- [ ] Role-based access preserved (agents vs owners if team roles apply).

---

## Issue 8 — Integrations hub: Channels + Tools

**Labels:** `dashboard`, `navigation`, `integrations`  
**Priority:** P1  
**Area:** `DashboardShell`, channels page, tools page, MCP OAuth

### Problem
Channels and custom tools are scattered; they should live under one **Integrations** tab.

### Proposal
- **Integrations** parent nav item with:
  - **Channels** — WhatsApp, SMS, web widget config
  - **Tools** — custom tools, MCP connections
- Cross-link to credentials/API keys where needed.

### Acceptance criteria
- [ ] One “Integrations” sidebar item replaces separate Channels + Tools entries.
- [ ] All existing functionality reachable from sub-tabs.
- [ ] Empty states explain how to connect first integration.

---

## Issue 9 — Remove Embed page from dashboard

**Labels:** `dashboard`, `navigation`  
**Priority:** P2  
**Area:** `apps/web/.../embed/page.tsx`, docs

### Problem
Embed instructions clutter the dashboard; embed setup belongs in docs or a one-time onboarding hint.

### Proposal
- Remove **Embed** from project sidebar.
- Surface embed snippet in: onboarding completion, Settings → Appearance, and public `/docs/embed`.
- Optional: “Copy embed code” modal from project overview.

### Acceptance criteria
- [ ] Embed sidebar link removed.
- [ ] Users can still copy `clientId` + snippet from Settings or docs within 2 clicks.
- [ ] No broken links in dashboard chatbot or landing page.

---

## Issue 10 — Sidebar header: avatar, profile page, account menu

**Labels:** `dashboard`, `auth`, `profile`  
**Priority:** P1  
**Area:** `DashboardShell`, new `/dashboard/profile` or `/dashboard/account`

### Problem
No proper **user identity** in the dashboard — avatar, name, logout, plan/credits summary should live in a header profile menu.

### Proposal
- Top of sidebar (or header bar): avatar + name + chevron menu.
- **Profile page:** name, email, password change, delete account (future).
- Show plan tier + credits remaining in menu or profile.
- Logout + link to billing (when Issue 13 ships).

### Acceptance criteria
- [ ] Avatar/initials shown for logged-in user.
- [ ] Profile page loads and saves name (email read-only or change via verify flow).
- [ ] Credits/plan visible without opening billing.
- [ ] Logout works from menu on all dashboard routes.

---

## Issue 11 — Company website scraper for onboarding & training

**Labels:** `onboarding`, `ai`, `scraper`  
**Priority:** P0 (blocks Issue 2 quality)  
**Area:** `packages/rag` website fetch, new `apps/api` scrape service, worker

### Problem
Question generation and bot training lack rich **company-specific** context when the user only provides a URL.

### Proposal
- Build a **controlled scraper** (respect robots.txt, rate limits, max pages/depth):
  - Homepage + about + contact + FAQ paths (heuristic + sitemap optional)
  - Extract title, meta description, headings, paragraph text
  - Summarize into a **BusinessProfile** blob stored on project/owner
- Feed summary into onboarding Q&A (Issue 2) and optional auto-knowledge ingest.
- Re-scrape on demand from Settings.

### Acceptance criteria
- [ ] Given a valid HTTPS URL, scraper returns structured summary within timeout (e.g. 30s).
- [ ] Failures are non-fatal; user can paste text manually.
- [ ] Scraped content stored and versioned; re-scrape updates draft before confirm.
- [ ] No unbounded crawling (max N pages, same-origin by default).

---

## Issue 12 — MCP server: refresh tool catalog for latest platform features

**Labels:** `mcp`, `developer-experience`  
**Priority:** P2  
**Area:** `packages/mcp-server`, docs

### Problem
The MCP server exposes **too many or outdated tools**; it doesn’t reflect the current product surface.

### Proposal
- Audit registered MCP tools vs dashboard capabilities.
- Group tools by domain (projects, knowledge, conversations, inbox, integrations).
- Deprecate/remove redundant tools; document each tool with examples.
- Version the MCP schema in release notes.

### Acceptance criteria
- [ ] MCP `list_tools` returns a curated set aligned with public API.
- [ ] Each tool has description + input schema + link to HTTP equivalent.
- [ ] Breaking changes documented; old tool names return helpful migration errors.
- [ ] `docs/mcp` updated.

---

## Issue 13 — Payments, credits, plan limits & billing gateway

**Labels:** `billing`, `payments`, `platform`  
**Priority:** P1  
**Area:** Stripe (or chosen gateway), `packages/shared` plan limits, dashboard billing UI

### Problem
Plans and credits exist in schema but there is no **production payment flow** or self-serve upgrade path.

### Proposal
- Integrate payment gateway (**Stripe** recommended): checkout, portal, webhooks.
- Map plans (Free / Pro / Enterprise) to **messages, documents, team seats, voice, credits**.
- Credit pack purchases; usage metering from `UsageEvent`.
- Enforce limits at API with clear upgrade CTAs in widget/dashboard.
- “Unlimited” or high-cap enterprise overrides for sales-assigned accounts.

### Acceptance criteria
- [ ] User can upgrade/downgrade via hosted checkout.
- [ ] Webhooks sync plan + credit balance to Postgres.
- [ ] API returns `PLAN_UPGRADE_REQUIRED` / `PLAN_LIMIT_EXCEEDED` with billing link.
- [ ] Dashboard shows usage vs limit for current billing period.
- [ ] Admin can grant enterprise override (ties to Issue 14).

---

## Issue 14 — Platform admin dashboard (internal)

**Labels:** `admin`, `internal`  
**Priority:** P2  
**Area:** new `apps/web/admin` or protected routes, admin API

### Problem
Operators need an **internal view** across tenants — users, projects, usage, support escalations, billing exceptions.

### Proposal
- Role: `ADMIN` or allowlist emails / separate admin app.
- Views: tenants, projects, usage aggregates, failed jobs, recent signups, manual plan override.
- Audit log for admin actions.

### Acceptance criteria
- [ ] Only platform admins can access `/admin/*`.
- [ ] List/search users and projects; drill into usage events.
- [ ] Manual credit grant and plan override with audit trail.
- [ ] No PII exposed without justification (mask emails in list, reveal on drill-down).

---

## Issue 15 — Observability: feature usage & spend (owner + admin)

**Labels:** `observability`, `analytics`, `admin`  
**Priority:** P1  
**Area:** `UsageEvent`, analytics routes, admin dashboard, optional Datadog/OpenTelemetry

### Problem
Business owners and platform admins can’t see **how each feature is used**, model spend, or performance health.

### Proposal
**Business owner dashboard:**
- Per-feature usage cards (chat messages, voice transcriptions, documents, handoffs, API calls).
- Trends over 7/30 days; export CSV.

**Admin dashboard:**
- Cross-tenant aggregates, error rates, queue depth, LLM cost estimates.

**Technical:**
- Structured logging + metrics (request latency, RAG retrieval scores, job failures).
- Consider OpenTelemetry → collector of choice.

### Acceptance criteria
- [ ] Owner sees feature breakdown on project analytics page.
- [ ] Admin sees platform-wide usage summary.
- [ ] Failed ingest/eval jobs visible with last error message.
- [ ] Documentation for adding new metric counters when shipping features.

---

## Issue 16 — Notifications: background jobs, failures, inbox alerts

**Labels:** `notifications`, `inbox`, `worker`  
**Priority:** P1  
**Area:** `packages/events`, email (Resend), web push (future), worker completion hooks

### Problem
Users aren’t notified when **background work** completes/fails or when an **agent inbox** item needs attention.

### Proposal
- **Email/in-app** notifications for:
  - Knowledge ingest complete / failed
  - Eval run complete / failed
  - New inbox escalation (to project owners + agents)
  - Credit threshold warnings (80%, 100%)
- Notification preferences in Settings (Issue 7).
- Optional: browser push for inbox when tab inactive.

### Acceptance criteria
- [ ] Ingest failure sends email to project owner with doc name + error snippet.
- [ ] New escalation sends email to configured destinations + in-app badge.
- [ ] User can disable categories in Settings.
- [ ] Idempotent sends (no duplicate emails on worker retry).

---

## Issue 17 — Evaluate Kafka for events & job queues

**Labels:** `architecture`, `infrastructure`, `spike`  
**Priority:** P3  
**Area:** `packages/events`, BullMQ/Redis today

### Problem
Event volume may outgrow Redis/BullMQ for **analytics, webhooks, and cross-service fan-out**. Team wants Kafka considered.

### Proposal
**Spike (1–2 days):**
- Document current event flows (chat events, webhooks, inbox SSE, worker queues).
- Compare Redis/BullMQ vs Kafka (or Redpanda/Upstash Kafka) for:
  - Durability, replay, ordering per session
  - Ops cost on Render/Vercel adjacent workers
- Recommendation doc: adopt, defer, or hybrid (Kafka for analytics only).

### Acceptance criteria
- [ ] Architecture doc with diagram of current vs proposed flow.
- [ ] Decision recorded: proceed / defer with triggers (e.g. “>X events/min”).
- [ ] If proceed: ticket breakdown for producer/consumer migration.

---

## Issue 18 — Documentation overhaul

**Labels:** `docs`  
**Priority:** P2  
**Area:** `docs/`, `apps/web/src/app/docs`, README

### Problem
Public and internal docs lag behind shipped features (team access, voice, inbox, MCP, embed).

### Proposal
- Refresh README quickstart, env vars, and deployment guides.
- Sync `/docs` pages with dashboard (embed, MCP, API auth).
- Add “Feature status” table (beta/stable/planned).
- Link each doc section to corresponding GitHub issue/roadmap item.

### Acceptance criteria
- [ ] Every major dashboard section has a docs page or README section.
- [ ] Env vars in `.env.example` match documented list.
- [ ] New contributors can run stack from docs alone (verified by dry run).

---

## Issue 19 — Landing page improvement

**Labels:** `marketing`, `web`, `design`  
**Priority:** P2  
**Area:** `apps/web/src/app/page.tsx`, marketing components

### Problem
Landing page should better communicate value, show live product, and convert signups.

### Proposal
- Sharpen hero: one line value prop + demo widget + primary CTA.
- Social proof, feature sections aligned with roadmap (not internal jargon).
- Performance pass (LCP, images, font loading).
- A/B-friendly CTA blocks.

### Acceptance criteria
- [ ] Lighthouse performance ≥ 90 on desktop for landing route.
- [ ] Live demo widget works with `NEXT_PUBLIC_DEMO_CLIENT_ID`.
- [ ] Mobile layout reviewed; no clipped hero or overflow.
- [ ] Copy reviewed — no unfilled “RAG/MCP” jargon on first viewport.

---

# Suggested sprint grouping

| Sprint theme | Issues |
|--------------|--------|
| **Onboarding quality** | 1, 2, 11 |
| **Dashboard IA & shell** | 3, 7, 8, 9, 10 |
| **Inbox & conversations** | 6 |
| **Storage & knowledge** | 5 |
| **Billing & limits** | 13 |
| **Ops & platform** | 14, 15, 16, 17 |
| **Developer & GTM** | 12, 18, 19 |
| **Triage** | 4 |

---

# GitHub issue creation (manual)

`gh` CLI was not available in the dev environment. To bulk-create issues after installing `gh`:

```bash
gh auth login
# Example for one issue:
gh issue create \
  --repo Abdul-Moiz31/QuickStart-ai \
  --title "Onboarding: loading state on AI question generation" \
  --label "onboarding,ux,dashboard" \
  --body-file docs/roadmap/issue-templates/01-onboarding-loader.md
```

Alternatively, copy each **Issue N** section above into GitHub → New issue.

---

*Captured: 29 Aug 2026 — source: co-founder product review.*
