import { describe, expect, it } from "vitest";
import { buildAuditMessage, buildSessionAuditTimeline } from "./session-audit.js";

describe("buildSessionAuditTimeline", () => {
  it("includes persisted system audit messages", () => {
    const at = new Date("2026-01-02T10:00:00.000Z");
    const timeline = buildSessionAuditTimeline(
      {
        messages: [
          buildAuditMessage("handoff_requested", { detail: "Need a person" }),
          buildAuditMessage("agent_joined", {
            agent: { id: "agent-1", name: "Sarah Chen", email: "sarah@example.com" },
          }),
        ],
        escalatedAt: at,
        takenOverAt: at,
        releasedAt: null,
        agentId: "agent-1",
      },
      new Map([["agent-1", { id: "agent-1", name: "Sarah Chen", email: "sarah@example.com" }]]),
    );

    expect(timeline.some((event) => event.type === "handoff_requested")).toBe(true);
    expect(timeline.some((event) => event.type === "agent_joined" && event.agentName === "Sarah Chen")).toBe(
      true,
    );
  });

  it("falls back to session timestamps for older sessions", () => {
    const escalatedAt = new Date("2026-01-02T09:00:00.000Z");
    const takenOverAt = new Date("2026-01-02T09:05:00.000Z");
    const timeline = buildSessionAuditTimeline(
      {
        messages: [],
        escalatedAt,
        takenOverAt,
        releasedAt: null,
        agentId: "agent-2",
      },
      new Map([["agent-2", { id: "agent-2", name: "Alex Kim", email: "alex@example.com" }]]),
    );

    expect(timeline).toEqual([
      expect.objectContaining({ type: "handoff_requested", at: escalatedAt.toISOString() }),
      expect.objectContaining({
        type: "agent_joined",
        at: takenOverAt.toISOString(),
        agentName: "Alex Kim",
      }),
    ]);
  });
});
