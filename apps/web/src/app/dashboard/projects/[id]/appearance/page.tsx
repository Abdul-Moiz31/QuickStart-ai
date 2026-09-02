"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, getStoredToken } from "@/lib/api";
import { DashBtn, DashField, DashPanel, DashTextarea } from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  ChatbotAppearancePreview,
  THEME_COLORS,
  type ColorSource,
  type PreviewTheme,
} from "@/components/dashboard/ChatbotAppearancePreview";

const THEMES: PreviewTheme[] = ["primary", "secondary", "tech", "professional"];

function detectColorSource(theme: PreviewTheme, primaryColor: string): ColorSource {
  const hex = primaryColor.trim().toLowerCase();
  if (!hex || hex === THEME_COLORS[theme].bg.toLowerCase()) return "theme";
  const matched = THEMES.find((t) => THEME_COLORS[t].bg.toLowerCase() === hex);
  if (matched) return "theme";
  return "custom";
}

export default function AppearancePage() {
  const { id } = useParams<{ id: string }>();
  const { refreshProjects, projects } = useDashboard();
  const project = projects.find((p) => p.id === id);
  const [colorSource, setColorSource] = useState<ColorSource>("theme");
  const [theme, setTheme] = useState<PreviewTheme>("primary");
  const [position, setPosition] = useState<"left" | "right">("right");
  const [primaryColor, setPrimaryColor] = useState("#0A0A0A");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi — how can I help?");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api<{
      project: {
        widgetTheme: string;
        widgetPosition: string;
        primaryColor: string;
        welcomeMessage: string;
      };
    }>(`/api/v1/projects/${id}`, { token }).then((res) => {
      let t = res.project.widgetTheme as PreviewTheme;
      if (!THEMES.includes(t)) t = "primary";
      const color = res.project.primaryColor ?? THEME_COLORS[t].bg;
      const byColor = THEMES.find((x) => THEME_COLORS[x].bg.toLowerCase() === color.trim().toLowerCase());
      if (byColor) t = byColor;
      setTheme(t);
      setPrimaryColor(color);
      setColorSource(detectColorSource(t, color));
      setPosition(res.project.widgetPosition === "left" ? "left" : "right");
      setWelcomeMessage(res.project.welcomeMessage ?? "Hi — how can I help?");
    });
  }, [id]);

  function chooseThemeMode() {
    setColorSource("theme");
    setPrimaryColor(THEME_COLORS[theme].bg);
  }

  function chooseCustomMode() {
    setColorSource("custom");
    if (THEMES.some((t) => THEME_COLORS[t].bg.toLowerCase() === primaryColor.trim().toLowerCase())) {
      setPrimaryColor("#0A0A0A");
    }
  }

  function onThemeChange(next: PreviewTheme) {
    setTheme(next);
    setColorSource("theme");
    setPrimaryColor(THEME_COLORS[next].bg);
  }

  function onPrimaryColorChange(next: string) {
    setPrimaryColor(next);
    setColorSource("custom");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      const savedColor =
        colorSource === "theme"
          ? THEME_COLORS[theme].bg
          : /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor.trim())
            ? primaryColor.trim()
            : "#0A0A0A";

      await api(`/api/v1/projects/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          widgetTheme: theme,
          widgetPosition: position,
          primaryColor: savedColor,
          welcomeMessage,
        }),
      });
      setPrimaryColor(savedColor);
      setMsg(
        colorSource === "theme"
          ? "Appearance saved (preset theme)"
          : "Appearance saved (custom color)",
      );
      await refreshProjects();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-clay/50 disabled:text-mute";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
      <h1 className="qs-h1">Appearance</h1>
      <p className="mt-2 text-sm text-mute">
        Choose either a preset theme or a custom primary color — not both.
      </p>
      {msg && <p className="mt-4 text-sm text-mute">{msg}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
        <form onSubmit={save}>
          <DashPanel className="space-y-5">
            <div>
              <p className="text-xs font-medium text-mute">Color style</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={chooseThemeMode}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                    colorSource === "theme"
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white text-ink hover:bg-clay"
                  }`}
                >
                  Preset theme
                </button>
                <button
                  type="button"
                  onClick={chooseCustomMode}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                    colorSource === "custom"
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white text-ink hover:bg-clay"
                  }`}
                >
                  Custom color
                </button>
              </div>
            </div>

            <div className={colorSource === "theme" ? "" : "opacity-45"}>
              <label className="block text-xs text-mute">Theme</label>
              <select
                value={theme}
                disabled={colorSource !== "theme"}
                onChange={(e) => onThemeChange(e.target.value as PreviewTheme)}
                className={`mt-1.5 ${selectClass}`}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tech">Tech</option>
                <option value="professional">Professional</option>
              </select>
              {colorSource === "theme" && (
                <div className="mt-2 flex gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      title={t}
                      onClick={() => onThemeChange(t)}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        theme === t ? "border-ink scale-110" : "border-transparent"
                      }`}
                      style={{ background: THEME_COLORS[t].bg }}
                      aria-label={`Select ${t} theme`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={colorSource === "custom" ? "" : "opacity-45"}>
              <label className="block text-xs text-mute">Primary color</label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="color"
                  disabled={colorSource !== "custom"}
                  value={/^#([0-9a-fA-F]{6})$/.test(primaryColor) ? primaryColor : "#0A0A0A"}
                  onChange={(e) => onPrimaryColorChange(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-ink/15 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Pick primary color"
                />
                <DashField
                  value={primaryColor}
                  disabled={colorSource !== "custom"}
                  onChange={(e) => onPrimaryColorChange(e.target.value)}
                  placeholder="#0A0A0A"
                  className="flex-1 disabled:cursor-not-allowed disabled:bg-clay/50"
                />
              </div>
            </div>

            <label className="block text-xs text-mute">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "left" | "right")}
              className={selectClass}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>

            <label className="block text-xs text-mute">Welcome message</label>
            <DashTextarea
              rows={3}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />

            <DashBtn type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save appearance"}
            </DashBtn>
          </DashPanel>
        </form>

        <div className="lg:sticky lg:top-6">
          <ChatbotAppearancePreview
            colorSource={colorSource}
            theme={theme}
            position={position}
            primaryColor={primaryColor}
            welcomeMessage={welcomeMessage}
            projectName={project?.name ?? "QuickStart AI"}
          />
        </div>
      </div>
    </div>
  );
}
