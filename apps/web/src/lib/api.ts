const LOCAL_API = "http://localhost:3100";

function configuredApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API;
}

/** Prefer local API when the app runs on localhost (avoids stale tunnel URLs in dev). */
export function resolvePublicApiUrl(): string {
  if (typeof window === "undefined") return configuredApiUrl();
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return LOCAL_API;
  }
  return configuredApiUrl();
}

export const API_URL = configuredApiUrl();

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const hasBody = rest.body !== undefined && rest.body !== null;
  const res = await fetch(`${resolvePublicApiUrl()}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("qs_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("qs_token", token);
  else localStorage.removeItem("qs_token");
}
