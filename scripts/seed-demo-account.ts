/**
 * Seeds the QuickStart demo account from fixtures/quickstart-demo-account.json
 * Run: pnpm seed:demo  (requires API + Redis + worker + Postgres)
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
config({ path: resolve(root, ".env") });

const API_URL = process.env.PUBLIC_API_URL ?? "http://localhost:3100";
const FIXTURE_PATH = resolve(root, "fixtures/quickstart-demo-account.json");
const LIVE_PATH = resolve(root, "fixtures/quickstart-demo-account.live.json");

type Fixture = {
  account: { name: string; email: string; password: string };
  business: Record<string, string>;
  project: { projectName: string; projectDescription: string };
  onboardingQuestions: string[];
  onboardingAnswers: string[];
  extraFaqs: { title: string; question: string; answer: string }[];
};

async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!res.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} → ${res.status}: ${(data as { message?: string }).message ?? JSON.stringify(data)}`,
    );
  }
  return data;
}

async function main() {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Fixture;
  const { account, business, project, onboardingQuestions, onboardingAnswers, extraFaqs } =
    fixture;

  if (onboardingQuestions.length !== onboardingAnswers.length) {
    throw new Error("Fixture questions and answers length mismatch");
  }

  console.log(`[seed] API: ${API_URL}`);
  console.log(`[seed] Account: ${account.email}`);

  let token: string;
  let userId: string;
  let defaultProjectId: string | undefined;

  try {
    const reg = await api<{
      token: string;
      user: { id: string };
      defaultProject?: { id: string };
    }>("/api/v1/auth/register", {
      method: "POST",
      body: account,
    });
    token = reg.token;
    userId = reg.user.id;
    defaultProjectId = reg.defaultProject?.id;
    console.log("[seed] Registered new user");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("User already exists")) throw err;
    const login = await api<{ token: string; user: { id: string } }>("/api/v1/auth/login", {
      method: "POST",
      body: { email: account.email, password: account.password },
    });
    token = login.token;
    userId = login.user.id;
    console.log("[seed] Logged in existing user");
  }

  const me = await api<{ user: { onboardingCompleted: boolean } }>("/api/v1/auth/me", { token });

  let projectId = defaultProjectId;
  let clientId = "";
  let clientSecret = "";

  if (!me.user.onboardingCompleted) {
    const complete = await api<{
      project: { id: string; name: string };
      credentials: { clientId: string; clientSecret: string };
    }>("/api/v1/onboarding/complete", {
      method: "POST",
      token,
      body: {
        ...business,
        ...project,
        questions: onboardingQuestions,
        answers: onboardingAnswers,
      },
    });
    projectId = complete.project.id;
    clientId = complete.credentials.clientId;
    clientSecret = complete.credentials.clientSecret;
    console.log("[seed] Onboarding complete → project", projectId);
  } else {
    const projects = await api<{
      projects: {
        id: string;
        name: string;
        credentials: { clientId: string }[];
      }[];
    }>("/api/v1/projects", { token });
    const p = projects.projects[0];
    if (!p) throw new Error("No project found for existing user");
    projectId = p.id;
    clientId = p.credentials[0]?.clientId ?? "";
    console.log("[seed] User already onboarded — using project", projectId);
  }

  if (!projectId) throw new Error("Missing projectId");

  await api(`/api/v1/projects/${projectId}`, {
    method: "PATCH",
    token,
    body: {
      widgetTheme: "primary",
      widgetPosition: "right",
      primaryColor: "#0A0A0A",
      welcomeMessage: "Hello! How can I assist you today?",
    },
  });
  console.log("[seed] Appearance set → black theme, bottom-right");

  for (const faq of extraFaqs) {
    const existing = await api<{ documents: { title: string }[] }>(
      `/api/v1/projects/${projectId}/knowledge`,
      { token },
    );
    if (existing.documents.some((d) => d.title === faq.title)) {
      console.log("[seed] FAQ skip (exists):", faq.title);
      continue;
    }
    await api(`/api/v1/projects/${projectId}/knowledge`, {
      method: "POST",
      token,
      body: {
        title: faq.title,
        content: `Q: ${faq.question}\nA: ${faq.answer}`,
        sourceType: "faq",
      },
    });
    console.log("[seed] FAQ queued:", faq.title);
  }

  const live = {
    seededAt: new Date().toISOString(),
    apiUrl: API_URL,
    webUrl: process.env.NEXT_PUBLIC_API_URL?.includes("3100")
      ? "http://localhost:3000"
      : (process.env.CORS_ORIGINS?.split(",")[0]?.trim() ?? "http://localhost:3000"),
    account: {
      email: account.email,
      password: account.password,
      name: account.name,
      userId,
    },
    project: {
      id: projectId,
      name: project.projectName,
    },
    embed: {
      clientId,
      clientSecret: clientSecret || "(already onboarded — rotate in Settings if needed)",
    },
    envSnippet: {
      NEXT_PUBLIC_DEMO_CLIENT_ID: clientId,
      NEXT_PUBLIC_API_URL: API_URL,
    },
    business,
    onboarding: {
      questions: onboardingQuestions,
      answers: onboardingAnswers,
    },
    extraFaqs,
    loginUrl: "http://localhost:3000/login",
    dashboardUrl: `http://localhost:3000/dashboard/projects/${projectId}/knowledge`,
  };

  writeFileSync(LIVE_PATH, JSON.stringify(live, null, 2));
  console.log("\n[seed] Done. Live details written to:");
  console.log(`       ${LIVE_PATH}`);
  console.log("\n[seed] Add to .env:");
  console.log(`       NEXT_PUBLIC_DEMO_CLIENT_ID=${clientId}`);
  console.log("\n[seed] Login:", account.email, "/", account.password);
  if (clientSecret) {
    console.log("[seed] clientSecret (save now):", clientSecret);
  }
  console.log("\n[seed] Wait ~30s for worker ingest, then test the widget on / and /dashboard");
}

main().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
