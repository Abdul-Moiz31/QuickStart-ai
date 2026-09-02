import type { CrawledPage } from "./website.js";

const OLOSTEP_BASE = "https://api.olostep.com";

interface OlostepCrawlResponse {
  id: string;
  status: "in_progress" | "completed" | string;
  pages_count?: number;
}

interface OlostepPageItem {
  url: string;
  retrieve_id?: string;
  markdown_content?: string;
}

interface OlostepPagesResponse {
  status: string;
  pages: OlostepPageItem[];
  cursor?: number;
  pages_count?: number;
}

interface OlostepRetrieveResponse {
  markdown_content?: string;
}

async function olostepFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${OLOSTEP_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Olostep ${path} failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/") return "Home";
    const segment = pathname.split("/").filter(Boolean).pop() ?? pathname;
    return segment.replace(/[-_]/g, " ");
  } catch {
    return url;
  }
}

async function retrieveMarkdown(apiKey: string, retrieveId: string): Promise<string | null> {
  const data = await olostepFetch<OlostepRetrieveResponse>(
    apiKey,
    `/v1/retrieve?retrieve_id=${encodeURIComponent(retrieveId)}&formats=markdown`,
  );
  const text = data.markdown_content?.trim();
  return text && text.length >= 80 ? text : null;
}

async function fetchAllPages(apiKey: string, crawlId: string): Promise<OlostepPageItem[]> {
  const pages: OlostepPageItem[] = [];
  let cursor = 0;
  for (;;) {
    const data = await olostepFetch<OlostepPagesResponse>(
      apiKey,
      `/v1/crawls/${encodeURIComponent(crawlId)}/pages?cursor=${cursor}&limit=25`,
    );
    pages.push(...(data.pages ?? []));
    if (data.cursor == null || data.cursor === cursor) break;
    cursor = data.cursor;
  }
  return pages;
}

/**
 * Deep crawl via Olostep when an API key is configured. Returns markdown pages
 * suitable for onboarding knowledge seeding and Q&A generation.
 */
export async function crawlWebsiteWithOlostep(
  startUrl: string,
  apiKey: string,
  opts: {
    maxPages?: number;
    maxCharsPerPage?: number;
    pollIntervalMs?: number;
    timeoutMs?: number;
  } = {},
): Promise<CrawledPage[]> {
  const maxPages = opts.maxPages ?? 15;
  const maxCharsPerPage = opts.maxCharsPerPage ?? 4000;
  const pollIntervalMs = opts.pollIntervalMs ?? 3000;
  const timeoutMs = opts.timeoutMs ?? 300_000;

  let parsed: URL;
  try {
    parsed = new URL(startUrl);
  } catch {
    return [];
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return [];

  const crawl = await olostepFetch<OlostepCrawlResponse>(apiKey, "/v1/crawls", {
    method: "POST",
    body: JSON.stringify({
      start_url: parsed.toString(),
      max_pages: maxPages,
      max_depth: 2,
      include_subdomain: false,
      include_external: false,
      scrape_options: { formats: ["markdown"] },
    }),
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await olostepFetch<OlostepCrawlResponse>(
      apiKey,
      `/v1/crawls/${encodeURIComponent(crawl.id)}`,
    );
    if (info.status === "completed") break;
    await sleep(pollIntervalMs);
  }

  const pageItems = await fetchAllPages(apiKey, crawl.id);
  const results: CrawledPage[] = [];

  for (const item of pageItems) {
    if (results.length >= maxPages) break;
    let text = item.markdown_content?.trim();
    if (!text && item.retrieve_id) {
      text = (await retrieveMarkdown(apiKey, item.retrieve_id)) ?? undefined;
    }
    if (!text || text.length < 80) continue;
    results.push({
      url: item.url,
      title: titleFromUrl(item.url),
      text: text.slice(0, maxCharsPerPage),
    });
  }

  return results;
}
