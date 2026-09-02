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

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

const INTERESTING_PATH_HINTS = [
  "about",
  "contact",
  "faq",
  "pricing",
  "plans",
  "support",
  "help",
  "service",
  "product",
  "team",
];

const SKIPPED_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|ico|woff2?|mp4|mp3)$/i;

async function fetchPage(
  url: string,
  timeoutMs: number,
): Promise<{ html: string; text: string; title: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "QuickStartAI-Onboarding/1.0 (+https://quickstart.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) return null;
    const html = await res.text();
    const text = htmlToPlainText(html);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
    return { html, text, title };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html: string, origin: URL): URL[] {
  const links: URL[] = [];
  const re = /<a\s[^>]*href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const href = match[1];
    if (!href) continue;
    try {
      const resolved = new URL(href, origin);
      if (resolved.origin !== origin.origin) continue;
      if (SKIPPED_EXTENSIONS.test(resolved.pathname)) continue;
      links.push(resolved);
    } catch {
      // ignore unparsable hrefs
    }
  }
  return links;
}

function isInteresting(link: URL): boolean {
  const haystack = `${link.pathname}`.toLowerCase();
  return INTERESTING_PATH_HINTS.some((hint) => haystack.includes(hint));
}

function normalizeUrl(url: string): string {
  const u = new URL(url);
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
}

/**
 * Crawl a business's own site (same-origin only): the homepage plus a handful
 * of linked pages that look like About/Contact/FAQ/Pricing, so onboarding can
 * draw on more than just the homepage snippet.
 */
export async function crawlWebsite(
  startUrl: string,
  opts: { maxPages?: number; maxCharsPerPage?: number; timeoutMs?: number } = {},
): Promise<CrawledPage[]> {
  const maxPages = opts.maxPages ?? 6;
  const maxCharsPerPage = opts.maxCharsPerPage ?? 3000;
  const timeoutMs = opts.timeoutMs ?? 8000;

  let origin: URL;
  try {
    origin = new URL(startUrl);
  } catch {
    return [];
  }
  if (!["http:", "https:"].includes(origin.protocol)) return [];

  const home = await fetchPage(origin.toString(), timeoutMs);
  if (!home) return [];

  const visited = new Set<string>([normalizeUrl(origin.toString())]);
  const pages: CrawledPage[] = [];
  const homeText = home.text.slice(0, maxCharsPerPage).trim();
  if (homeText.length >= 80) {
    pages.push({ url: origin.toString(), title: home.title, text: homeText });
  }

  const candidateLinks = extractLinks(home.html, origin).filter((link) => isInteresting(link));

  for (const link of candidateLinks) {
    if (pages.length >= maxPages) break;
    const norm = normalizeUrl(link.toString());
    if (visited.has(norm)) continue;
    visited.add(norm);

    const page = await fetchPage(link.toString(), timeoutMs);
    if (!page) continue;
    const text = page.text.slice(0, maxCharsPerPage).trim();
    if (text.length >= 80) {
      pages.push({ url: link.toString(), title: page.title, text });
    }
  }

  return pages;
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
