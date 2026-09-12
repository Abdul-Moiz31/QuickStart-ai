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
