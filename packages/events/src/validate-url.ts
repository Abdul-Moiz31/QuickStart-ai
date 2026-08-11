const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIp(hostname: string): boolean {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  return false;
}

export function assertPublicHttpsUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid webhook URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIp(host)) {
    throw new Error("Webhook URL cannot point to a private or local address");
  }
}

export function maskUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const path = url.pathname.length > 12 ? `${url.pathname.slice(0, 8)}…` : url.pathname;
    return `${url.protocol}//${url.hostname}${path}`;
  } catch {
    return "invalid-url";
  }
}
