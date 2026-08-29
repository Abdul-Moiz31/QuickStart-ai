import type { Project } from "@quickstart-ai/db";
import { prisma } from "@quickstart-ai/db";
import {
  ForbiddenError,
  NotFoundError,
  roleAtLeast,
  type MemberRole,
} from "@quickstart-ai/shared";

export type ProjectAccess = {
  project: Project;
  role: MemberRole;
  /** True when user is Project.ownerId (billing / irreversible ops). */
  isOwner: boolean;
};

export type ProjectAccessOptions = {
  minRole?: MemberRole;
  ownerOnly?: boolean;
};

export async function requireProjectAccess(
  projectId: string,
  userId: string,
  opts: ProjectAccessOptions = {},
): Promise<ProjectAccess> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { project: true },
  });

  if (!member) throw new NotFoundError("Project not found");

  const isOwner = member.project.ownerId === userId;

  if (opts.ownerOnly && !isOwner) {
    throw new ForbiddenError("Owner access required");
  }

  if (opts.minRole && !roleAtLeast(member.role as MemberRole, opts.minRole)) {
    throw new ForbiddenError("Insufficient project permissions");
  }

  return {
    project: member.project,
    role: member.role as MemberRole,
    isOwner,
  };
}

/** Session routes carry no tenant id — resolve project through Mongo session. */
export async function requireSessionProjectAccess(
  sessionProjectId: string,
  userId: string,
  opts: ProjectAccessOptions = {},
): Promise<ProjectAccess> {
  return requireProjectAccess(sessionProjectId, userId, opts);
}

/** Strip billing/credential fields for non-owner dashboard responses. */
export function stripProjectForMember<T extends Project>(
  project: T,
  access: ProjectAccess,
): Omit<T, "llmApiKeyEnc"> & { credits?: number } {
  if (access.isOwner) return project;
  const { llmApiKeyEnc: _key, credits: _credits, ...rest } = project;
  return rest as Omit<T, "llmApiKeyEnc"> & { credits?: number };
}
