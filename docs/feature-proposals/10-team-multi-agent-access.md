# 10 — Team & Multi-agent Access

**Type:** Platform  
**Priority:** Low  
**Effort:** Large  

---

## Problem

Every project in QuickStart AI is owned by a single user. There is no way to invite teammates to manage knowledge, review conversations, or handle human handoffs. Any business with more than one person on their support team is blocked — the owner must share their login credentials, which is a security anti-pattern and makes the Human Agent Inbox feature (proposal #02) unusable for teams.

## User Story

> As a startup founder, I want to invite my two support agents to the dashboard — so they can monitor conversations and handle escalations without seeing my API keys or billing details.

## Proposed Design

### Role model

Three roles (enough for most small teams, keeps it simple):

| Role | Permissions |
|------|-------------|
| `owner` | Full access — billing, credentials, delete project |
| `admin` | Manage knowledge, integrations, settings. Cannot delete project or see billing |
| `agent` | Read conversations, reply in Human Agent Inbox, read analytics. Cannot change settings |

### Database schema (Prisma)

```prisma
model ProjectMember {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @db.Uuid
  project   Project  @relation(...)
  userId    String   @db.Uuid
  user      User     @relation(...)
  role      MemberRole @default(agent)
  invitedBy String   @db.Uuid
  joinedAt  DateTime?
  createdAt DateTime @default(now())

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

enum MemberRole {
  owner
  admin
  agent
}
```

### Invite flow

1. Owner/admin clicks "Invite teammate" in project settings
2. Enters email address + selects role
3. API creates a `ProjectInvite` record with a signed token (24h expiry)
4. Email sent to the invitee with an accept link: `https://app.quickstart.ai/invite?token=...`
5. Invitee clicks link → if no account, prompted to register → account created → joined to project as `ProjectMember`
6. If invitee already has an account, they are added directly after clicking accept

### Auth changes

- `requireAuth` middleware in `apps/api/src/auth.ts` currently sets `req.user` from JWT
- Add a `requireProjectMember(role: MemberRole[])` helper that checks `ProjectMember` table
- Replace raw `ownerId` checks in project routes with this helper
- `agent` role: read-only on all project endpoints except Human Agent Inbox reply

### Dashboard UI

New "Team" section in project settings:
- List of current members with avatar, name, email, role, "Remove" button
- "Invite teammate" form (email + role dropdown)
- Pending invites list with "Resend" / "Cancel" actions
- Owner cannot remove themselves

### Plan gating

| Plan | Team members |
|------|-------------|
| free | 1 (owner only) |
| pro | 5 |
| enterprise | unlimited |

### Human Agent Inbox integration

When multiple agents are `agent` role members, the inbox (proposal #02) shows who took over which session. Sessions taken by another agent are locked (read-only for others, with "taken by Alice" indicator).

## Affected Packages

| Package | Change |
|---------|--------|
| `packages/db` | `ProjectMember`, `ProjectInvite` Prisma models |
| `apps/api` | Invite routes, `requireProjectMember` middleware, role-based guards on all project routes |
| `packages/shared` | `MemberRole` enum, invite Zod schemas |
| `apps/web` | Team settings page, invite accept page, member list UI |

## Acceptance Criteria

- [ ] Owner can invite a teammate by email with a role assignment
- [ ] Invitee receives email with accept link (24h expiry)
- [ ] Accepted invitee can log in and see the shared project
- [ ] `agent` role cannot access settings, credentials, or knowledge editing
- [ ] `admin` role cannot see billing or delete the project
- [ ] Owner cannot be removed from a project
- [ ] Free plan rejects invite (only 1 member allowed)
- [ ] Human Agent Inbox shows which agent has taken over a session

## Open Questions

- Should agents see each other's names in the conversation view (e.g., "Replied by Alice")?
- Should there be an audit log of admin actions (knowledge changes, settings edits)?
- Multi-project team management: a shared "workspace" where members can be invited once and access multiple projects?
