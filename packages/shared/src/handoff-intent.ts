/** Visitor explicitly wants a human — used by widget UI and API fallback escalation. */
export function visitorRequestsHumanHelp(text: string): boolean {
  return /(?:speak|talk)\s+(?:to|with)\s+(?:a\s+|an\s+|the\s+|our\s+)?(?:human|person|agent|representative|someone|real\s+person|support|team|customer\s+service)|connect\s+(?:me\s+)?with\s+(?:a\s+|an\s+|the\s+|our\s+)?(?:human|agent|person|support|team|representative)|contact\s+(?:support|customer\s+service)|(?:need|want)\s+(?:a\s+|an\s+)?(?:human|agent|real\s+person)|transfer\s+(?:me\s+)?to\s+(?:a\s+|an\s+)?(?:human|agent|person|support)|(?:human|live)\s+agent|real\s+person|escalate(?:\s+this|\s+to\s+support)?|forward(?:\s+my\s+request)?\s+to\s+(?:the\s+)?(?:team|support|agent)|(?:reach|get)\s+(?:a\s+|an\s+)?(?:human|agent|person)/i.test(
    text.trim(),
  );
}

/** Assistant offered or claimed a handoff — drives the "Connect to support" button. */
export function looksLikeHandoffOffer(text: string): boolean {
  return /connect\s+(?:you\s+)?with|connect\s+to\s+support|(?:our\s+)?support\s+team|speak\s+to\s+(?:a\s+|an\s+)?(?:human|person|agent|representative)|talk\s+to\s+someone|forward(?:ed|ing)?\s+(?:your\s+)?(?:request\s+)?to\s+(?:the\s+)?(?:support|agent|team)|(?:notified|alerted)\s+(?:the\s+|our\s+)?(?:team|support|agent)|someone\s+from\s+(?:the\s+|our\s+)?(?:team|support)|(?:human|live)\s+agent|hand(?:ed)?\s+off|escalat(?:ed|ing)|join\s+(?:the\s+)?chat|team\s+will\s+(?:join|be\s+with|reach)|agent\s+will\s+(?:join|be\s+with)|waiting\s+for\s+(?:a\s+|an\s+)?(?:agent|representative)/i.test(
    text.trim(),
  );
}

/** Nonsense / keyboard mash — should not trigger human escalation. */
export function looksLikeGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return true;
  if (/^[^a-zA-Z0-9\s\u00C0-\u024F]{2,}$/.test(t)) return true;
  if (/^(asdf|qwer|zxcv|hjkl|1234+|aaaa+|bbbb+|testtest|lorem)/i.test(t)) return true;
  if (/(.)\1{5,}/.test(t)) return true;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const w = words[0]!;
    if (w.length >= 10 && !/[aeiouAEIOU]/.test(w)) return true;
    if (w.length >= 6 && /^[^a-zA-Z0-9]+$/.test(w)) return true;
  }

  const letters = t.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 8) {
    const vowels = letters.replace(/[^aeiouAEIOU]/g, "").length;
    if (vowels / letters.length < 0.08) return true;
  }

  return false;
}

export const HANDOFF_AGENT_GUIDELINES = [
  "Human support rules:",
  "- Call escalate_to_human when the visitor clearly asks for a person, agent, or the support team.",
  "- NEVER say you forwarded, escalated, or notified anyone unless escalate_to_human ran this turn.",
  "- For gibberish, random characters, or messages that are not a real question: politely ask them to rephrase. Do NOT escalate.",
  "- When escalating, say briefly that someone from the team will join shortly — do not invent names or ticket numbers.",
].join("\n");
