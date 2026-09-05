import { getRedis } from "../redis.js";
import { env } from "../env.js";

export type VoiceSessionStatus = "starting" | "live" | "ended" | "failed";

export interface VoiceSessionState {
  voiceSessionId: string;
  projectId: string;
  chatSessionId?: string;
  provider: string;
  status: VoiceSessionStatus;
  startedAt: string;
  lastHeartbeatAt: string;
  resumptionHandle?: string;
}

function sessionKey(voiceSessionId: string): string {
  return `voice:session:${voiceSessionId}`;
}

function projectActiveKey(projectId: string): string {
  return `voice:project:${projectId}:active`;
}

function resumptionKey(voiceSessionId: string): string {
  return `voice:resumption:${voiceSessionId}`;
}

async function redisReady() {
  const r = getRedis();
  if (r.status !== "ready") await r.connect();
  return r;
}

export async function saveVoiceSession(state: VoiceSessionState): Promise<void> {
  const r = await redisReady();
  const ttl = env.voiceSessionTtlSec;
  await r.set(sessionKey(state.voiceSessionId), JSON.stringify(state), "EX", ttl);
  if (state.status === "starting" || state.status === "live") {
    await r.sadd(projectActiveKey(state.projectId), state.voiceSessionId);
    await r.expire(projectActiveKey(state.projectId), ttl);
  }
}

export async function getVoiceSession(voiceSessionId: string): Promise<VoiceSessionState | null> {
  const r = await redisReady();
  const raw = await r.get(sessionKey(voiceSessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VoiceSessionState;
  } catch {
    return null;
  }
}

export async function touchVoiceSession(
  voiceSessionId: string,
  patch: Partial<Pick<VoiceSessionState, "status" | "lastHeartbeatAt" | "resumptionHandle">>,
): Promise<VoiceSessionState | null> {
  const current = await getVoiceSession(voiceSessionId);
  if (!current) return null;
  const next: VoiceSessionState = {
    ...current,
    ...patch,
    lastHeartbeatAt: patch.lastHeartbeatAt ?? new Date().toISOString(),
  };
  await saveVoiceSession(next);
  return next;
}

export async function endVoiceSession(
  voiceSessionId: string,
  status: "ended" | "failed" = "ended",
): Promise<VoiceSessionState | null> {
  const current = await getVoiceSession(voiceSessionId);
  if (!current) return null;
  const next: VoiceSessionState = { ...current, status, lastHeartbeatAt: new Date().toISOString() };
  const r = await redisReady();
  await r.set(sessionKey(voiceSessionId), JSON.stringify(next), "EX", 300);
  await r.srem(projectActiveKey(current.projectId), voiceSessionId);
  return next;
}

export async function countActiveVoiceSessions(projectId: string): Promise<number> {
  const r = await redisReady();
  return r.scard(projectActiveKey(projectId));
}

export async function setResumptionHandle(voiceSessionId: string, handle: string): Promise<void> {
  const r = await redisReady();
  await r.set(resumptionKey(voiceSessionId), handle, "EX", env.voiceSessionTtlSec);
  await touchVoiceSession(voiceSessionId, { resumptionHandle: handle });
}

export async function getResumptionHandle(voiceSessionId: string): Promise<string | null> {
  const r = await redisReady();
  return r.get(resumptionKey(voiceSessionId));
}
