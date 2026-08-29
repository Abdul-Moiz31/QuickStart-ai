---
name: quickstart-ui
description: >-
  QuickStart AI web design system — light clay + white elite UI for the marketing
  site and dashboard. Use when editing apps/web pages, components, Tailwind tokens,
  landing, auth, or dashboard UX for QuickStart AI.
---

# QuickStart UI (Elite Clay)

## Visual system

| Token | Hex | Use |
|-------|-----|-----|
| Clay | `#F7F5F1` | Page background (soft) |
| White | `#FFFFFF` | Navbar, alternate sections, CTA panels |
| Porcelain | `#FAF8F5` | Small elevated panels on clay |
| Ink | `#0A0A0A` | Bold headlines + primary UI |
| Mute | `#5C5A56` | Body / secondary text |
| Line | `rgba(10,10,10,0.08)` | Hairline borders |
| Accent | `#0A0A0A` | Buttons (hover `#1A1A1A`) — no colored brand accents |

**Type:**
- **Marketing section headlines:** Outfit (`font-sans`) + `font-bold` + solid `text-black` + `text-3xl md:text-4xl` — consistent size/weight across landing sections.
- **Brand / display accents:** Syne (`font-display`) where a more expressive mark is needed (nav wordmark, hero brand moments).
- **Body / UI:** Outfit (`font-sans`) regular–bold.
- **Credentials / code:** JetBrains Mono (`font-mono`) only.

Do **not** use light/muted Syne for primary section headlines on landing — prefer Outfit black.

**Brand:** “QuickStart AI” must be hero-level on marketing first viewport — not nav-only.

**Landing rhythm:** clay page → white sections alternate → white navbar → white final CTA panel.

## Motion

- Default: **Framer Motion** (enters, stagger, dashboard animations).
- Modals / dialogs: **@headlessui/react** `Dialog` (accessible focus trap, backdrop, ESC). Pair with Framer Motion transitions when helpful.
- Icons: **lucide-react** — never hand-roll SVG icons when lucide has the glyph.
- Landing scroll sequences only: **GSAP + ScrollTrigger**.
- Do **not** use Three.js for this product UI.
- Prefer installing a maintained library over brute-force custom primitives (modals, icons, steppers).
- Honor `prefers-reduced-motion`: disable scrub/stagger; show final state.

## Landing rules

- One composition in the first viewport: brand, one headline, one support line, one CTA group, one dominant **chatbot widget mock**.
- Purpose must be obvious: AI chatbot installed with one line of code, answers from the user’s business knowledge.
- No infra jargon on marketing (no RAG/HyDE/Redis/eval rails).
- No inset hero cards, no floating badges/chips on hero media.
- Sections: one job, one headline, one short support sentence each.

## Dashboard rules

- **White / clay dashboard** — match landing: `bg-white` page, `bg-clay` sidebar, ink text (`text-ink` / `text-mute`).
- **No floating bubble navbar** in the dashboard.
- Collapsible left sidebar with lucide icons, project dropdown switcher, credits, and section links (Knowledge, Credentials, Conversations, Eval, Appearance, Tools). Documentation covers embed install.
- **Soft onboarding (not a hard redirect):** after register, user lands on the dashboard. A Headless UI step modal welcomes them (“Thanks for registering… onboarding for your default project”). They may dismiss it and browse. Project tabs (and creating extra projects) require finishing onboarding first — show a gate + reopen the modal.
- Register creates a **Default project**; onboarding configures it (business → AI questions → project name → credentials).
- Headings: Outfit bold; panels: white with light borders (`border-ink/[0.08]`), black primary buttons.
- Credentials/code: navy stylish code panels (`.qs-code-*`).

## Forbidden (AI-slop patterns)

- Mesh grids, neon blurs, purple/indigo gradients, floating orbs
- Glassmorphism stacks, glow shadows, emoji in UI
- Teal/signal-green accents, cream+terracotta default pairings
- Generic “01 / 02 / 03” icon rows as the main visual idea
- Dense dashboard chrome that looks like a template admin kit

## Checklist before shipping UI

- [ ] Light clay page + white sections; ink accents only
- [ ] Brand test on marketing hero
- [ ] Chatbot story clear without technical jargon
- [ ] Motion respects reduced-motion
- [ ] Mobile readable; no horizontal overflow
