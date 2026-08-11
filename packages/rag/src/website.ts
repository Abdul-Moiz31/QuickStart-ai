/**
 * Lightweight public-page research for onboarding (no queue).
 * Fetches HTML and extracts readable text for the LLM prompt.
 */
export async function fetchWebsiteSummary(
  url: string,
  opts: { maxChars?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  const maxChars = opts.maxChars ?? 4500;
  const timeoutMs = opts.timeoutMs ?? 8000;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "QuickStartAI-Onboarding/1.0 (+https://quickstart.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return null;
    }
    const html = await res.text();
    const text = htmlToPlainText(html).slice(0, maxChars).trim();
    return text.length >= 80 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
