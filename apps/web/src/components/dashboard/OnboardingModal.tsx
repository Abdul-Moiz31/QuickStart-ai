"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Loader2, PartyPopper, RefreshCw, Sparkles, X } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { DashBtn, DashField, DashTextarea } from "@/components/dashboard/DashboardShell";

type Step = "welcome" | "business" | "questions" | "project" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "business", label: "Business" },
  { id: "questions", label: "Questions" },
  { id: "project", label: "Project" },
  { id: "done", label: "Done" },
];

const SCAN_STAGE_MESSAGES: Record<string, string> = {
  reading: "Reading your business details…",
  scanning: "Scanning your website…",
  knowledge: "Building your knowledge base…",
  questions: "Drafting questions and suggested answers…",
};
const SCAN_FALLBACK_MESSAGE = "Still working — almost ready…";
const SCAN_POLL_INTERVAL_MS = 1200;
const GENERATE_MORE_COUNT = 3;

interface RegenerateResponse {
  success: boolean;
  questions: string[];
  suggestedAnswers: string[];
  model: string | null;
}

interface ScanStatusResponse {
  success: boolean;
  state: "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown";
  progress: { stage: string; pct: number } | null;
  result?: {
    questions: string[];
    suggestedAnswers?: string[];
    model: string | null;
    researchedWebsite: boolean;
    scannedPageCount: number;
    businessLocation?: string;
    supportEmail?: string;
  };
  error?: string;
}

export function OnboardingModal() {
  const {
    user,
    onboardingOpen,
    dismissOnboarding,
    markOnboardingComplete,
    projects,
  } = useDashboard();

  const [step, setStep] = useState<Step>("welcome");
  const [busy, setBusy] = useState(false);
  const [scanStage, setScanStage] = useState<string>("reading");
  const cancelScanRef = useRef(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [creds, setCreds] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const [business, setBusiness] = useState({
    businessName: "",
    businessWebsite: "",
    businessIndustry: "",
    businessDescription: "",
    businessLocation: "",
    supportEmail: "",
  });
  const [projectName, setProjectName] = useState("Default project");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    if (onboardingOpen && user && !user.onboardingCompleted) {
      const defaultName = projects[0]?.name || "Default project";
      setProjectName(defaultName);
    }
  }, [onboardingOpen, user, projects]);

  useEffect(() => {
    return () => {
      cancelScanRef.current = true;
    };
  }, []);

  if (!user || user.onboardingCompleted) return null;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pollScanJob(jobId: string, token: string) {
    while (!cancelScanRef.current) {
      const status = await api<ScanStatusResponse>(`/api/v1/onboarding/scan/${jobId}`, {
        token,
      });
      if (cancelScanRef.current) return;

      if (status.progress?.stage) setScanStage(status.progress.stage);

      if (status.state === "completed" && status.result) {
        const { questions: generated, suggestedAnswers, businessLocation, supportEmail } =
          status.result;
        setQuestions(generated);
        setAnswers(
          generated.map((_, i) => suggestedAnswers?.[i]?.trim() ?? ""),
        );
        setBusiness((b) => ({
          ...b,
          businessLocation: b.businessLocation || businessLocation || b.businessLocation,
          supportEmail: b.supportEmail || supportEmail || b.supportEmail,
        }));
        if (!projectName.trim()) setProjectName(business.businessName);
        setStep("questions");
        setBusy(false);
        return;
      }

      if (status.state === "failed") {
        setError(status.error || "Failed to generate questions");
        setBusy(false);
        return;
      }

      await sleep(SCAN_POLL_INTERVAL_MS);
    }
  }

  async function startWebsiteScan() {
    setError("");
    setBusy(true);
    setScanStage("reading");
    cancelScanRef.current = false;
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Not signed in");
      const { jobId } = await api<{ jobId: string }>("/api/v1/onboarding/scan", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...business,
          businessWebsite: business.businessWebsite || undefined,
          supportEmail: business.supportEmail || undefined,
        }),
      });
      await pollScanJob(jobId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
      setBusy(false);
    }
  }

  function submitBusiness(e: FormEvent) {
    e.preventDefault();
    void startWebsiteScan();
  }

  async function submitAnswers(e: FormEvent) {
    e.preventDefault();
    if (answers.some((a) => !a.trim())) {
      setError("Please answer every question — they train your chatbot.");
      return;
    }
    setError("");
    setStep("project");
  }

  async function fetchQuestionPairs(count: number, existingQuestions: string[]) {
    const token = getStoredToken();
    if (!token) throw new Error("Not signed in");
    return api<RegenerateResponse>("/api/v1/onboarding/regenerate-questions", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...business,
        businessWebsite: business.businessWebsite || undefined,
        supportEmail: business.supportEmail || undefined,
        existingQuestions,
        count,
      }),
    });
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
    setAnswers((as) => as.filter((_, idx) => idx !== i));
  }

  async function regenerateQuestion(i: number) {
    setError("");
    setRegeneratingIndex(i);
    try {
      const { questions: newQ, suggestedAnswers: newA } = await fetchQuestionPairs(1, questions);
      if (newQ[0]) {
        setQuestions((qs) => qs.map((q, idx) => (idx === i ? newQ[0]! : q)));
        setAnswers((as) => as.map((a, idx) => (idx === i ? (newA[0]?.trim() ?? "") : a)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate question");
    } finally {
      setRegeneratingIndex(null);
    }
  }

  async function regenerateAllQuestions() {
    setError("");
    setRegeneratingAll(true);
    try {
      const count = Math.max(questions.length, 6);
      const { questions: newQ, suggestedAnswers: newA } = await fetchQuestionPairs(count, []);
      setQuestions(newQ);
      setAnswers(newQ.map((_, i) => newA[i]?.trim() ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate questions");
    } finally {
      setRegeneratingAll(false);
    }
  }

  async function generateMoreQuestions() {
    setError("");
    setGeneratingMore(true);
    try {
      const { questions: newQ, suggestedAnswers: newA } = await fetchQuestionPairs(
        GENERATE_MORE_COUNT,
        questions,
      );
      setQuestions((qs) => [...qs, ...newQ]);
      setAnswers((as) => [...as, ...newQ.map((_, i) => newA[i]?.trim() ?? "")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate more questions");
    } finally {
      setGeneratingMore(false);
    }
  }

  async function completeOnboarding(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Not signed in");
      const res = await api<{
        project: { id: string; name: string };
        credentials: { clientId: string; clientSecret: string };
      }>("/api/v1/onboarding/complete", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...business,
          questions,
          answers,
          projectName,
          projectDescription: projectDescription || undefined,
        }),
      });
      setCreds(res.credentials);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    await markOnboardingComplete();
  }

  return (
    <Transition show={onboardingOpen} as={Fragment}>
      <Dialog
        onClose={() => {
          if (step === "done") return;
          dismissOnboarding();
        }}
        className="relative z-50"
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
              <div className="flex items-start justify-between gap-3 border-b border-ink/[0.08] px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                    Onboarding · step {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length}
                  </p>
                  <DialogTitle className="mt-1 font-sans text-lg font-bold text-ink">
                    {step === "welcome" && "Welcome aboard"}
                    {step === "business" && "About your business"}
                    {step === "questions" && "Train your chatbot"}
                    {step === "project" && "Name your project"}
                    {step === "done" && "You're set"}
                  </DialogTitle>
                </div>
                {step !== "done" && (
                  <button
                    type="button"
                    onClick={dismissOnboarding}
                    className="rounded-lg p-2 text-mute transition hover:bg-clay hover:text-ink"
                    aria-label="Close onboarding"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 border-b border-ink/[0.06] px-5 py-3">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i <= stepIndex ? "bg-ink" : "bg-ink/10"
                    }`}
                    title={s.label}
                  />
                ))}
              </div>

              <div className="overflow-y-auto px-5 py-5">
                {error && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
                    <p>{error}</p>
                    {step === "business" && (
                      <button
                        type="button"
                        onClick={() => void startWebsiteScan()}
                        className="shrink-0 rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink transition hover:bg-ink hover:text-porcelain"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}

                {step === "welcome" && (
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-clay">
                        <PartyPopper
                          className="h-8 w-8 text-ink"
                          strokeWidth={1.6}
                          aria-hidden
                        />
                      </div>
                    </div>
                    <Description className="text-center text-sm leading-relaxed text-mute">
                      Thanks for registering. Now we need to do the onboarding for your default
                      project so the chatbot can answer from your business knowledge.
                    </Description>
                    <p className="text-center text-sm text-mute">
                      You can close this and explore the dashboard anytime. Project tabs like
                      Knowledge and other project tabs will ask you to finish onboarding first.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <DashBtn type="button" className="flex-1" onClick={() => setStep("business")}>
                        Start onboarding
                      </DashBtn>
                      <DashBtn type="button" variant="ghost" className="flex-1" onClick={dismissOnboarding}>
                        Maybe later
                      </DashBtn>
                    </div>
                  </div>
                )}

                {step === "business" && busy && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-9 w-9 animate-spin text-ink" strokeWidth={1.75} aria-hidden />
                    <p className="text-sm font-medium text-ink" aria-live="polite">
                      {SCAN_STAGE_MESSAGES[scanStage] || SCAN_FALLBACK_MESSAGE}
                    </p>
                    <p className="text-xs text-mute">
                      {business.businessWebsite
                        ? "We're scanning your site and building your chatbot's knowledge base — this usually takes a few seconds."
                        : "Your AI is putting together questions tailored to your business — this usually takes a few seconds."}
                    </p>
                  </div>
                )}

                {step === "business" && !busy && (
                  <form onSubmit={submitBusiness} className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Business name *</span>
                      <DashField
                        className="mt-1.5"
                        required
                        value={business.businessName}
                        onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                        placeholder="Acme Cloud"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Website</span>
                      <DashField
                        className="mt-1.5"
                        type="url"
                        value={business.businessWebsite}
                        onChange={(e) =>
                          setBusiness({ ...business, businessWebsite: e.target.value })
                        }
                        placeholder="https://acme.com"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Industry *</span>
                      <DashField
                        className="mt-1.5"
                        required
                        value={business.businessIndustry}
                        onChange={(e) =>
                          setBusiness({ ...business, businessIndustry: e.target.value })
                        }
                        placeholder="SaaS, ecommerce, agency…"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Business description *</span>
                      <DashTextarea
                        className="mt-1.5"
                        required
                        minLength={20}
                        rows={4}
                        value={business.businessDescription}
                        onChange={(e) =>
                          setBusiness({ ...business, businessDescription: e.target.value })
                        }
                        placeholder="What you sell, who you help, and common support questions…"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-mute">Location</span>
                        <DashField
                          className="mt-1.5"
                          value={business.businessLocation}
                          onChange={(e) =>
                            setBusiness({ ...business, businessLocation: e.target.value })
                          }
                          placeholder="City / country"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-mute">Support email</span>
                        <DashField
                          className="mt-1.5"
                          type="email"
                          value={business.supportEmail}
                          onChange={(e) =>
                            setBusiness({ ...business, supportEmail: e.target.value })
                          }
                          placeholder="support@acme.com"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <DashBtn type="button" variant="ghost" onClick={() => setStep("welcome")}>
                        Back
                      </DashBtn>
                      <DashBtn type="submit" disabled={busy} className="flex-1">
                        {busy ? "Generating…" : "Continue"}
                      </DashBtn>
                    </div>
                  </form>
                )}

                {step === "questions" && (
                  <form onSubmit={submitAnswers} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-mute">
                        We drafted answers from your website where possible — review, edit,
                        remove, or regenerate each one. Your chatbot learns from these.
                      </p>
                      <button
                        type="button"
                        disabled={regeneratingAll || busy}
                        onClick={() => void regenerateAllQuestions()}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-porcelain disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${regeneratingAll ? "animate-spin" : ""}`}
                          strokeWidth={1.75}
                        />
                        Regenerate all
                      </button>
                    </div>
                    {questions.map((q, i) => (
                      <div key={`${i}-${q}`} className="rounded-xl border border-ink/[0.08] bg-clay/40 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-ink">
                            {i + 1}. {q}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label="Regenerate this question"
                              disabled={regeneratingIndex === i || regeneratingAll}
                              onClick={() => void regenerateQuestion(i)}
                              className="rounded-lg p-1.5 text-mute transition hover:bg-white hover:text-ink disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${regeneratingIndex === i ? "animate-spin" : ""}`}
                                strokeWidth={1.75}
                              />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove this question"
                              onClick={() => removeQuestion(i)}
                              className="rounded-lg p-1.5 text-mute transition hover:bg-white hover:text-ink"
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                        <DashTextarea
                          className="mt-3 bg-white"
                          required
                          rows={3}
                          value={answers[i] ?? ""}
                          onChange={(e) => {
                            const next = [...answers];
                            next[i] = e.target.value;
                            setAnswers(next);
                          }}
                          placeholder="Your answer…"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={generatingMore}
                      onClick={() => void generateMoreQuestions()}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/20 px-3 py-2.5 text-xs font-semibold text-mute transition hover:border-ink/40 hover:text-ink disabled:opacity-50"
                    >
                      <Sparkles
                        className={`h-3.5 w-3.5 ${generatingMore ? "animate-pulse" : ""}`}
                        strokeWidth={1.75}
                      />
                      {generatingMore ? "Generating more…" : "Generate more questions"}
                    </button>
                    <div className="flex gap-2">
                      <DashBtn type="button" variant="ghost" onClick={() => setStep("business")}>
                        Back
                      </DashBtn>
                      <DashBtn type="submit" className="flex-1">
                        Continue
                      </DashBtn>
                    </div>
                  </form>
                )}

                {step === "project" && (
                  <form onSubmit={completeOnboarding} className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Project name *</span>
                      <DashField
                        className="mt-1.5"
                        required
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Acme Support Bot"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-mute">Project description</span>
                      <DashTextarea
                        className="mt-1.5"
                        rows={3}
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Optional short summary"
                      />
                    </label>
                    <div className="flex gap-2">
                      <DashBtn type="button" variant="ghost" onClick={() => setStep("questions")}>
                        Back
                      </DashBtn>
                      <DashBtn type="submit" disabled={busy} className="flex-1">
                        {busy ? "Finishing…" : "Finish setup"}
                      </DashBtn>
                    </div>
                  </form>
                )}

                {step === "done" && creds && (
                  <div className="space-y-4">
                    <p className="text-sm text-mute">
                      Save these credentials now — the client secret is shown once.
                    </p>
                    <div className="qs-code-frame">
                      <div className="qs-code-bar">
                        <span className="text-sm font-medium text-white/90">Credentials</span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
                          shown once
                        </span>
                      </div>
                      <pre className="qs-code-body text-[11px] sm:text-[12px]">
                        <code>
                          <span className="qs-code-attr">client_id</span>
                          <span className="qs-code-punct">: </span>
                          <span className="qs-code-str">{creds.clientId}</span>
                          {"\n"}
                          <span className="qs-code-attr">client_secret</span>
                          <span className="qs-code-punct">: </span>
                          <span className="qs-code-str">{creds.clientSecret}</span>
                        </code>
                      </pre>
                    </div>
                    <DashBtn type="button" className="w-full" onClick={finish}>
                      Go to dashboard
                    </DashBtn>
                  </div>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
