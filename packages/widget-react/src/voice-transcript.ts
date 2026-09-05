import type { VoiceTranscriptEvent } from "@quickstart-ai/voice-core";
import type { ChatMessage } from "@quickstart-ai/widget-core";

export type VoiceTurnIndexes = {
  userIdx: number | null;
  assistantIdx: number | null;
  nextTurnId: number;
};

export type VoiceFinalizedTurn = {
  turnId: number;
  role: "user" | "assistant";
  content: string;
};

const WORD_CHAR = /[\p{L}\p{N}\u0900-\u097F]/u;

function isWordChar(ch: string): boolean {
  return WORD_CHAR.test(ch);
}

function longestSuffixPrefixOverlap(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  for (let len = max; len > 0; len -= 1) {
    if (a.endsWith(b.slice(0, len))) return len;
  }
  return 0;
}

function needsSpaceBetween(prev: string, next: string): boolean {
  if (!prev || !next) return false;
  if (/\s$/.test(prev) || /^\s/.test(next)) return false;
  const prevChar = prev.slice(-1);
  const nextChar = next[0] ?? "";
  return isWordChar(prevChar) && isWordChar(nextChar);
}

/** Merge incremental STT chunks into readable text with proper word spacing. */
export function mergeTranscriptText(existing: string, incoming: string): string {
  const prev = existing.trim();
  const next = incoming.trim();
  if (!prev) return next;
  if (!next) return prev;
  if (next === prev) return prev;
  if (next.startsWith(prev)) return next;
  if (prev.startsWith(next)) return prev;
  if (prev.endsWith(next)) return prev;
  if (next.includes(prev)) return next;

  const overlap = longestSuffixPrefixOverlap(prev, next);
  if (overlap > 0) {
    return prev + next.slice(overlap);
  }

  if (next.length > prev.length && !prev.startsWith(next)) {
    const reverseOverlap = longestSuffixPrefixOverlap(next, prev);
    if (reverseOverlap >= Math.floor(prev.length * 0.5)) {
      return next;
    }
  }

  const gap = needsSpaceBetween(prev, next) ? " " : "";
  return `${prev}${gap}${next}`;
}

function toFinalizedTurn(msg: ChatMessage | undefined): VoiceFinalizedTurn | undefined {
  if (!msg || (msg.role !== "user" && msg.role !== "assistant")) return undefined;
  if (msg.voiceTurnId == null) return undefined;
  const content = msg.content.trim();
  if (!content) return undefined;
  return { turnId: msg.voiceTurnId, role: msg.role, content };
}

function finalizeStreamingBubble(
  messages: ChatMessage[],
  idx: number | null,
): { messages: ChatMessage[]; finalized?: VoiceFinalizedTurn } {
  if (idx === null || !messages[idx]) return { messages };
  const msg = messages[idx]!;
  if (!msg.streaming) return { messages };
  const copy = [...messages];
  copy[idx] = { ...msg, streaming: false };
  return { messages: copy, finalized: toFinalizedTurn(copy[idx]) };
}

export function applyVoiceTranscript(
  messages: ChatMessage[],
  event: VoiceTranscriptEvent,
  turn: VoiceTurnIndexes,
): { messages: ChatMessage[]; turn: VoiceTurnIndexes; finalizedTurn?: VoiceFinalizedTurn } {
  if (!event.text.trim()) {
    return { messages, turn };
  }

  let copy = [...messages];
  const idxKey = event.role === "user" ? "userIdx" : "assistantIdx";
  let idx = turn[idxKey];
  let nextTurn = { ...turn };
  let finalizedTurn: VoiceFinalizedTurn | undefined;

  if (event.role === "user" && nextTurn.assistantIdx !== null) {
    const finalized = finalizeStreamingBubble(copy, nextTurn.assistantIdx);
    copy = finalized.messages;
    finalizedTurn = finalized.finalized;
    nextTurn.assistantIdx = null;
  }

  if (event.role === "assistant" && nextTurn.userIdx !== null) {
    const finalized = finalizeStreamingBubble(copy, nextTurn.userIdx);
    copy = finalized.messages;
    finalizedTurn = finalized.finalized;
    nextTurn.userIdx = null;
  }

  const content =
    idx !== null && copy[idx]?.role === event.role
      ? mergeTranscriptText(copy[idx]!.content, event.text)
      : event.text.trim();

  if (idx !== null && copy[idx]?.role === event.role) {
    copy[idx] = {
      ...copy[idx]!,
      role: event.role,
      content,
      streaming: !event.final,
    };
  } else {
    idx = copy.length;
    const voiceTurnId = nextTurn.nextTurnId;
    nextTurn = { ...nextTurn, [idxKey]: idx, nextTurnId: nextTurn.nextTurnId + 1 };
    copy.push({ role: event.role, content, streaming: !event.final, voiceTurnId });
  }

  if (event.final && idx !== null && copy[idx]) {
    copy[idx] = {
      ...copy[idx]!,
      role: event.role,
      content: copy[idx]!.content.trim(),
      streaming: false,
    };
    finalizedTurn = toFinalizedTurn(copy[idx]);
    nextTurn = { ...nextTurn, [idxKey]: null };
  }

  return { messages: copy, turn: nextTurn, finalizedTurn };
}

export function finalizeVoiceTranscripts(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => (m.streaming ? { ...m, streaming: false } : m));
}

export type VoiceTranscriptBatchTurn = {
  role: "user" | "assistant";
  content: string;
  clientTurnId: string;
};

/** Collect voice turns that have not yet been persisted to the server. */
export function collectUnpersistedVoiceTurns(
  messages: ChatMessage[],
  persistedTurnIds: ReadonlySet<number>,
): VoiceTranscriptBatchTurn[] {
  const turns: VoiceTranscriptBatchTurn[] = [];
  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    if (msg.streaming || msg.voiceTurnId == null) continue;
    if (persistedTurnIds.has(msg.voiceTurnId)) continue;
    const content = msg.content.trim();
    if (!content) continue;
    turns.push({
      role: msg.role,
      content,
      clientTurnId: String(msg.voiceTurnId),
    });
  }
  return turns;
}

/** Skip assistant bubble when voice repeats the existing welcome message. */
export function isDuplicateWelcome(
  messages: ChatMessage[],
  incoming: string,
): boolean {
  const normalized = incoming.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  const welcomes = messages
    .filter((m) => m.role === "assistant" && !m.streaming)
    .map((m) => m.content.trim().toLowerCase().replace(/\s+/g, " "));
  return welcomes.some((w) => w === normalized || w.includes(normalized) || normalized.includes(w));
}
