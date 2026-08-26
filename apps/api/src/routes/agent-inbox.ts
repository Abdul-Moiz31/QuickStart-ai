import type { FastifyInstance } from "fastify";
import { connectMongo, getChatSessionModel, isValidSessionId, prisma } from "@quickstart-ai/db";
import { ConflictError, ForbiddenError, NotFoundError } from "@quickstart-ai/shared";
import { z } from "zod";
import { requireAuth, requireClient } from "../auth.js";
import {
  inboxChannel,
  publishInboxEvent,
  publishSessionEvent,
  sessionChannel,
} from "../realtime.js";
import { streamChannels } from "../sse.js";
import { isHandoffStale } from "../handoff.js";

const agentMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

/** Confirms the caller owns the project. Mirrors the ownerId check used across dashboard routes. */
async function requireProjectOwner(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true, name: true },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

/** Session ids carry no tenant information, so ownership is resolved through the project, never trusted from the URL. */
async function requireOwnedSession(sessionId: string, userId: string) {
  if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");
  await connectMongo();
  const Session = getChatSessionModel();
  const session = await Session.findById(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  await requireProjectOwner(session.projectId, userId);
  return { Session, session };
}

export async function agentInboxRoutes(app: FastifyInstance) {
  /** Pending and active escalations for one project. */
  app.get("/api/v1/projects/:id/inbox", async (req) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectOwner(id, req.user!.id);

    await connectMongo();
    const Session = getChatSessionModel();
    const sessions = await Session.find({
      projectId: id,
      $or: [{ humanPending: true }, { humanActive: true }],
    })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return {
      success: true,
      sessions: sessions.map((s) => {
        const lastMessage = s.messages?.[s.messages.length - 1];
        return {
          id: String(s._id),
          visitorName: s.visitorName,
          visitorEmail: s.visitorEmail,
          humanPending: Boolean(s.humanPending),
          humanActive: Boolean(s.humanActive),
          // Reported, never acted on: the badge refreshes this endpoint in the
          // background, and a mutating read would retire conversations unseen.
          stale: isHandoffStale(s),
          agentId: s.agentId ?? null,
          escalatedAt: s.escalatedAt ?? null,
          takenOverAt: s.takenOverAt ?? null,
          messageCount: s.messages?.length ?? 0,
          lastMessage: lastMessage
            ? { role: lastMessage.role, content: lastMessage.content.slice(0, 200) }
            : null,
          updatedAt: (s as { updatedAt?: Date }).updatedAt ?? null,
        };
      }),
    };
  });

  /** Live inbox feed: new escalations, visitor replies and typing. */
  app.get("/api/v1/projects/:id/inbox/stream", async (req, reply) => {
    await requireAuth(req);
    const { id } = req.params as { id: string };
    await requireProjectOwner(id, req.user!.id);

    await streamChannels({
      req,
      reply,
      channels: [inboxChannel(id)],
      initialEvent: { type: "connected", at: new Date().toISOString() },
    });
  });

  /** Full transcript for the inbox detail panel. */
  app.get("/api/v1/agent/sessions/:sessionId", async (req) => {
    await requireAuth(req);
    const { sessionId } = req.params as { sessionId: string };
    const { session } = await requireOwnedSession(sessionId, req.user!.id);

    return {
      success: true,
      session: {
        id: String(session._id),
        projectId: session.projectId,
        visitorName: session.visitorName,
        visitorEmail: session.visitorEmail,
        humanPending: Boolean(session.humanPending),
        humanActive: Boolean(session.humanActive),
        agentId: session.agentId ?? null,
        messages: (session.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: (m as { createdAt?: Date }).createdAt ?? null,
        })),
      },
    };
  });

  /** Claim a session. */
  app.patch("/api/v1/agent/sessions/:sessionId/takeover", async (req) => {
    await requireAuth(req);
    const { sessionId } = req.params as { sessionId: string };
    const { Session, session } = await requireOwnedSession(sessionId, req.user!.id);

    // The condition lives in the query: a read-then-write would let two tabs both
    // pass the check and the second silently overwrite the first agent's claim.
    const now = new Date();
    const claimed = await Session.findOneAndUpdate(
      { _id: session._id, humanActive: { $ne: true } },
      {
        $set: {
          humanActive: true,
          humanPending: false,
          agentId: req.user!.id,
          takenOverAt: now,
          agentLastActiveAt: now,
        },
      },
      { new: true },
    );
    if (!claimed) throw new ConflictError("This conversation was already taken by another agent");

    await publishSessionEvent(sessionId, { type: "human_active" });
    await publishInboxEvent(session.projectId, {
      type: "session_taken",
      sessionId,
      agentId: req.user!.id,
    });

    return { success: true, session: { id: sessionId, humanActive: true } };
  });

  /** Send a reply as the human agent. */
  app.post("/api/v1/agent/sessions/:sessionId/message", async (req) => {
    await requireAuth(req);
    const { sessionId } = req.params as { sessionId: string };
    const body = agentMessageSchema.parse(req.body);
    const { session } = await requireOwnedSession(sessionId, req.user!.id);

    if (!session.humanActive) {
      throw new ForbiddenError("Take the conversation over before replying");
    }
    if (session.agentId && session.agentId !== req.user!.id) {
      throw new ForbiddenError("Another agent is handling this conversation");
    }

    const at = new Date();
    session.messages.push({ role: "agent", content: body.content, meta: { agentId: req.user!.id } });
    session.agentLastActiveAt = at;
    // Persisted before publishing, so a Redis outage costs live delivery, not the message.
    await session.save();

    await publishSessionEvent(sessionId, {
      type: "agent_message",
      content: body.content,
      at: at.toISOString(),
    });

    return { success: true, message: { role: "agent", content: body.content, at } };
  });

  /** Hand the conversation back to the bot. */
  app.patch("/api/v1/agent/sessions/:sessionId/release", async (req) => {
    await requireAuth(req);
    const { sessionId } = req.params as { sessionId: string };
    const { Session, session } = await requireOwnedSession(sessionId, req.user!.id);

    await Session.updateOne(
      { _id: session._id },
      {
        $set: { humanActive: false, humanPending: false, releasedAt: new Date() },
        $unset: { agentId: "" },
      },
    );

    await publishSessionEvent(sessionId, { type: "human_released" });
    await publishInboxEvent(session.projectId, { type: "session_released", sessionId });

    return { success: true, session: { id: sessionId, humanActive: false } };
  });

  /** Agent typing indicator, forwarded to the visitor's widget. */
  app.post("/api/v1/agent/sessions/:sessionId/typing", async (req) => {
    await requireAuth(req);
    const { sessionId } = req.params as { sessionId: string };
    const { session } = await requireOwnedSession(sessionId, req.user!.id);
    if (!session.humanActive) return { success: true };

    await publishSessionEvent(sessionId, { type: "agent_typing" });
    return { success: true };
  });

  /**
   * Visitor-side live stream. Authenticated with clientId from the query string
   * because EventSource cannot set headers; requireClient already accepts that form
   * and clientId is public, it ships in the embed snippet.
   */
  app.get("/api/v1/chat/sessions/:sessionId/stream", async (req, reply) => {
    await requireClient(req);
    const { sessionId } = req.params as { sessionId: string };
    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");

    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId).select("projectId humanActive").lean();
    if (!session || session.projectId !== req.projectId) {
      throw new NotFoundError("Session not found");
    }

    await streamChannels({
      req,
      reply,
      channels: [sessionChannel(sessionId)],
      initialEvent: { type: "connected", humanActive: Boolean(session.humanActive) },
    });
  });

  /** Visitor typing indicator, forwarded to the inbox. */
  app.post("/api/v1/chat/sessions/:sessionId/typing", async (req) => {
    // Called on a timer while someone types: a Postgres write per ping is not worth
    // a field that a sent message updates anyway.
    await requireClient(req, { touch: false });
    const { sessionId } = req.params as { sessionId: string };
    if (!isValidSessionId(sessionId)) throw new NotFoundError("Session not found");

    await connectMongo();
    const Session = getChatSessionModel();
    const session = await Session.findById(sessionId).select("projectId humanActive").lean();
    if (!session || session.projectId !== req.projectId) {
      throw new NotFoundError("Session not found");
    }
    // Only meaningful while a human is reading the inbox.
    if (!session.humanActive) return { success: true };

    await publishInboxEvent(req.projectId!, { type: "visitor_typing", sessionId });
    return { success: true };
  });
}
