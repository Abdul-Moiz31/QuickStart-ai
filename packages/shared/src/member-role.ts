/** Project-scoped team roles (mirrors Prisma MemberRole enum). */
export const MEMBER_ROLES = ["owner", "admin", "agent"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** Invitable roles — owner is implicit via project.ownerId. */
export const INVITE_ROLES = ["admin", "agent"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

const ROLE_RANK: Record<MemberRole, number> = {
  owner: 3,
  admin: 2,
  agent: 1,
};

/** True when `role` meets or exceeds `minRole` in the hierarchy. */
export function roleAtLeast(role: MemberRole, minRole: MemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/** Roles that may invite or manage team members. */
export function canManageTeam(role: MemberRole): boolean {
  return roleAtLeast(role, "admin");
}
