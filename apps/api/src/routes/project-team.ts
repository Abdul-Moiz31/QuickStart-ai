import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "@quickstart-ai/db";
import {
  AppError,
  acceptProjectInviteSchema,
  canManageTeam,
  createProjectInviteSchema,
  ForbiddenError,
  NotFoundError,
  PLAN_LIMITS,
  updateProjectMemberRoleSchema,
  type MemberRole,
} from "@quickstart-ai/shared";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { env } from "../env.js";
import { sendProjectInviteEmail } from "../mail/resend.js";
import { requireProjectAccess } from "../project-access.js";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function countTeamSlots(projectId: string) {
  const [members, pending] = await Promise.all([
    prisma.projectMember.count({ where: { projectId } }),
    prisma.projectInvite.count({
      where: { projectId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);
  return members + pending;
}

async function assertTeamCapacity(projectId: string, plan: keyof typeof PLAN_LIMITS) {
  const limit = PLAN_LIMITS[plan].teamMembers;
  const used = await countTeamSlots(projectId);
  if (used >= limit) {
    throw new AppError("Team member limit reached for this plan", 403, "TEAM_LIMIT_REACHED");
  }
}

export async function projectTeamRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects/:id/members", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return {
      success: true,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
        isOwner: m.role === "owner",
      })),
    };
  });

  app.patch("/api/v1/projects/:id/members/:userId", async (req) => {
    await requireAuth(req);
    const { id, userId } = req.params as { id: string; userId: string };
    const body = updateProjectMemberRoleSchema.parse(req.body);
    const access = await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });
    if (!target) throw new NotFoundError("Member not found");
    if (target.role === "owner") {
      throw new ForbiddenError("Cannot change the project owner's role");
    }

    if (body.role === "admin" && !access.isOwner) {
      throw new ForbiddenError("Only the project owner can assign admin role");
    }

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: id, userId } },
      data: { role: body.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return { success: true, member: updated };
  });

  app.delete("/api/v1/projects/:id/members/:userId", async (req) => {
    await requireAuth(req);
    const { id, userId } = req.params as { id: string; userId: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });
    if (!target) throw new NotFoundError("Member not found");
    if (target.role === "owner") {
      throw new ForbiddenError("Cannot remove the project owner");
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } },
    });

    return { success: true };
  });

  app.get("/api/v1/projects/:id/invites", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const invites = await prisma.projectInvite.findMany({
      where: {
        projectId: id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    };
  });

  app.post("/api/v1/projects/:id/invites", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    const body = createProjectInviteSchema.parse(req.body);
    const access = await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    if (!canManageTeam(access.role)) {
      throw new ForbiddenError("Insufficient project permissions");
    }

    await assertTeamCapacity(id, access.project.plan);

    const email = normalizeEmail(body.email);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: existingUser.id } },
      });
      if (existingMember) {
        throw new AppError("This user is already a team member", 409, "ALREADY_MEMBER");
      }
    }

    const pending = await prisma.projectInvite.findFirst({
      where: {
        projectId: id,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      throw new AppError("An invite is already pending for this email", 409, "INVITE_PENDING");
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invite = await prisma.projectInvite.create({
      data: {
        projectId: id,
        email,
        role: body.role,
        tokenHash,
        invitedBy: req.user!.id,
        expiresAt,
      },
    });

    const inviteUrl = `${env.webAppUrl}/invite?token=${rawToken}`;
    const inviter = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true },
    });

    const mailResult = await sendProjectInviteEmail({
      to: email,
      projectName: access.project.name,
      role: body.role,
      inviteUrl,
      inviterName: inviter?.name,
      log: req.log,
    });

    return {
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      ...(mailResult.devPreviewUrl && { inviteUrl: mailResult.devPreviewUrl }),
    };
  });

  app.post("/api/v1/projects/:id/invites/:inviteId/resend", async (req) => {
    await requireAuth(req);
    const { id, inviteId } = req.params as { id: string; inviteId: string };
    const access = await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const invite = await prisma.projectInvite.findFirst({
      where: { id: inviteId, projectId: id, acceptedAt: null, revokedAt: null },
    });
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.expiresAt < new Date()) {
      throw new AppError("Invite has expired — create a new one", 400, "INVITE_EXPIRED");
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await prisma.projectInvite.update({
      where: { id: inviteId },
      data: { tokenHash, expiresAt },
    });

    const inviteUrl = `${env.webAppUrl}/invite?token=${rawToken}`;
    const inviter = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true },
    });

    const mailResult = await sendProjectInviteEmail({
      to: invite.email,
      projectName: access.project.name,
      role: invite.role,
      inviteUrl,
      inviterName: inviter?.name,
      log: req.log,
    });

    return {
      success: true,
      expiresAt,
      ...(mailResult.devPreviewUrl && { inviteUrl: mailResult.devPreviewUrl }),
    };
  });

  app.delete("/api/v1/projects/:id/invites/:inviteId", async (req) => {
    await requireAuth(req);
    const { id, inviteId } = req.params as { id: string; inviteId: string };
    await requireProjectAccess(id, req.user!.id, { minRole: "admin" });

    const invite = await prisma.projectInvite.findFirst({
      where: { id: inviteId, projectId: id, acceptedAt: null },
    });
    if (!invite) throw new NotFoundError("Invite not found");

    await prisma.projectInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  });

  app.get("/api/v1/invites/preview", async (req) => {
    const token = z.string().length(64).parse((req.query as { token?: string }).token);
    const tokenHash = hashToken(token);

    const invite = await prisma.projectInvite.findUnique({
      where: { tokenHash },
      include: { project: { select: { id: true, name: true } } },
    });

    if (!invite || invite.revokedAt || invite.acceptedAt) {
      throw new AppError("Invalid or expired invite", 400, "INVALID_INVITE");
    }

    const expired = invite.expiresAt < new Date();
    const inviter = await prisma.user.findUnique({
      where: { id: invite.invitedBy },
      select: { name: true },
    });

    return {
      success: true,
      invite: {
        projectId: invite.projectId,
        projectName: invite.project.name,
        email: invite.email,
        role: invite.role,
        expired,
        expiresAt: invite.expiresAt,
        inviterName: inviter?.name ?? null,
      },
    };
  });

  app.post("/api/v1/invites/accept", async (req) => {
    await requireAuth(req);
    const body = acceptProjectInviteSchema.parse(req.body);
    const tokenHash = hashToken(body.token);

    const invite = await prisma.projectInvite.findUnique({
      where: { tokenHash },
      include: { project: true },
    });

    if (!invite || invite.revokedAt || invite.acceptedAt) {
      throw new AppError("Invalid or expired invite", 400, "INVALID_INVITE");
    }
    if (invite.expiresAt < new Date()) {
      throw new AppError("Invite has expired", 400, "INVITE_EXPIRED");
    }

    const userEmail = normalizeEmail(req.user!.email);
    if (userEmail !== normalizeEmail(invite.email)) {
      throw new ForbiddenError("This invite was sent to a different email address");
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: invite.projectId, userId: req.user!.id } },
    });
    if (existing) {
      await prisma.projectInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return {
        success: true,
        projectId: invite.projectId,
        role: existing.role,
        alreadyMember: true,
      };
    }

    await assertTeamCapacity(invite.projectId, invite.project.plan);

    const member = await prisma.$transaction(async (tx) => {
      await tx.projectInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return tx.projectMember.create({
        data: {
          projectId: invite.projectId,
          userId: req.user!.id,
          role: invite.role as MemberRole,
          invitedBy: invite.invitedBy,
        },
      });
    });

    return {
      success: true,
      projectId: invite.projectId,
      role: member.role,
      alreadyMember: false,
    };
  });
}
