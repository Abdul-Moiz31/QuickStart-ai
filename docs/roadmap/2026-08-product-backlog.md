# Product backlog — Aug 2026

Simple list of planned work. Each item can become a GitHub issue. Copy a section into **New issue** when ready to build.

---

## 1. Onboarding — show loading while questions generate

**Issue:** When AI generates onboarding questions, the button looks frozen. Users think nothing is happening.

**Fix:** Show a spinner and “Generating…” inside the button. Disable the button until done. Show an error + retry if it fails.

---

## 2. Onboarding — better questions with suggested answers

**Issue:** Generated questions are weak and have no draft answers. Nothing to review before saving.

**Fix:** Use website/company info to generate **question + answer** pairs. Let the user edit, remove, or regenerate. Only save when they click confirm.

---

## 3. Dashboard design refresh

**Issue:** Dashboard looks outdated and inconsistent with the rest of the product.

**Fix:** One design pass — spacing, headers, cards, buttons, mobile layout — aligned with the current brand style.

---

## 4. Apps section — fix or clarify

**Issue:** Something in the Apps area is broken or confusing (exact steps still need to be written down).

**Fix:** Reproduce the bug, document it, then fix or hide the feature until it works.

---

## 5. Upload documents to Cloudflare R2

**Issue:** File storage is not set up for production-scale document uploads.

**Fix:** Store knowledge files in a Cloudflare R2 bucket. API gives upload URL; worker ingests from R2 as today.

---

## 6. Conversations & inbox — better UI

**Issue:** Inbox and conversation pages are hard to use — hard to see status, visitor info, and messages at a glance.

**Fix:** Cleaner list view, clearer pending vs live chat, better transcript layout, real-time updates without refresh.

---

## 7. Move items into Settings

**Issue:** Too many items in the sidebar.

**Fix:** Put **Appearance**, **Notifications**, **Documentation**, and **Custom events** under one **Settings** page with tabs or sub-links.

---

## 8. Move Channels & Tools into Integrations

**Issue:** Channels and tools feel scattered.

**Fix:** One **Integrations** section with **Channels** and **Tools** inside it.

---

## 9. Remove Embed page from dashboard

**Issue:** Embed code doesn’t need its own sidebar page.

**Fix:** Remove Embed from nav. Keep copy-code in Settings, onboarding, or docs.

---

## 10. Profile menu — avatar & account page

**Issue:** No proper user menu in the dashboard (avatar, profile, logout).

**Fix:** Sidebar/header avatar, dropdown menu, and a simple profile page (name, email, plan/credits, logout).

---

## 11. Scrape company website for onboarding

**Issue:** We don’t pull enough info from the business website to train the bot or generate good questions.

**Fix:** Scrape key pages (about, contact, FAQ), summarize, and use that text for onboarding and knowledge.

---

## 12. Update MCP server tool list

**Issue:** MCP exposes too many or outdated tools; doesn’t match what the product actually does now.

**Fix:** Audit tools, remove clutter, group by feature, update docs.

---

## 13. Payments & credits

**Issue:** No real payment flow; plans and credits are not fully wired for upgrades and limits.

**Fix:** Add a payment gateway (e.g. Stripe), self-serve upgrade, usage limits, and credit balance in the dashboard.

---

## 14. Admin dashboard (internal)

**Issue:** No internal view for the team to manage users, projects, and overrides.

**Fix:** Protected admin area — search users/projects, view usage, grant credits or plan changes, basic audit log.

---

## 15. Usage & observability

**Issue:** Owners can’t see which features they use or how much. We can’t monitor platform health easily.

**Fix:** Usage charts per feature (chat, voice, docs, handoffs) for owners; summary + errors for admins.

---

## 16. Better notifications

**Issue:** No alerts when background jobs fail or when someone needs inbox help.

**Fix:** Email/in-app alerts for ingest fail/complete, eval jobs, new inbox escalation, low credits. Preferences in Settings.

---

## 17. Kafka — worth it or not?

**Issue:** Redis queues may not scale for all event types long term.

**Fix:** Short research doc — current flows vs Kafka/Redpanda — then decide adopt, defer, or hybrid.

---

## 18. Update documentation

**Issue:** Docs are behind the product (voice, team, inbox, MCP, etc.).

**Fix:** Refresh README, env vars, embed/MCP guides, and match what’s in the dashboard today.

---

## 19. Improve landing page

**Issue:** Landing page could sell the product better and feel more polished.

**Fix:** Clearer hero, working demo widget, faster load, mobile-friendly layout.

---

## Suggested order

| Phase | Items |
|-------|--------|
| Onboarding | 1, 2, 11 |
| Dashboard layout | 3, 7, 8, 9, 10 |
| Inbox & chat | 6 |
| Files | 5 |
| Billing | 13 |
| Platform | 14, 15, 16, 17 |
| Growth | 12, 18, 19 |
| Triage | 4 |

---

*Last updated: Aug 2026*
