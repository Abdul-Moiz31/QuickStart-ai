"use client";

import { Fragment, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  ChevronDown,
  FileText,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import {
  StatusPill,
  DashBtn,
  DashField,
  DashTextarea,
} from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { EvalLaunchNotice } from "@/components/dashboard/eval/EvalLaunchNotice";
import {
  classifyKnowledgeDoc,
  parseKnowledgeQa,
  type KnowledgeQaPair,
  type KnowledgeSection,
} from "@quickstart-ai/shared";

type KnowledgeDoc = {
  id: string;
  title: string;
  status: string;
  sourceType: string;
  rawContent: string;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { chunks: number };
};

type FaqRow = KnowledgeQaPair & {
  docId: string;
  docTitle: string;
  qaIndex: number;
};

type AddMode = "faq" | "text" | "file" | null;

function statusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "PENDING") return "Queued";
  if (s === "PROCESSING") return "Processing";
  if (s === "READY") return "Ready";
  if (s === "FAILED") return "Failed";
  return s;
}

function parseProfileSections(raw: string): { label: string; value: string }[] {
  const profileMatch = raw.match(/Business profile\s*([\s\S]*?)(?:\n\nDescription:|\n\nQ&A:|$)/i);
  if (!profileMatch) return [];
  const block = profileMatch[1] ?? "";
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { label: "Info", value: line };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((x) => x.value && x.value !== "n/a");
}

function extractDescription(raw: string): string | null {
  const m = raw.match(/Description:\s*([\s\S]*?)(?:\n\nQ&A:|$)/i);
  return m?.[1]?.trim() || null;
}

function JobsBanner({ docs }: { docs: KnowledgeDoc[] }) {
  const active = docs.filter((d) => d.status === "PENDING" || d.status === "PROCESSING");
  if (active.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Loader2 className="h-4 w-4 animate-spin text-mute" strokeWidth={1.75} />
        Ingest jobs running · {active.length}
      </div>
      <ul className="mt-2 space-y-1">
        {active.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2 text-xs text-mute">
            <span className="truncate">{d.title}</span>
            <StatusPill status={d.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QaEditor({
  pair,
  onSave,
  onCancel,
  busy,
}: {
  pair: FaqRow;
  onSave: (question: string, answer: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [question, setQuestion] = useState(pair.question);
  const [answer, setAnswer] = useState(pair.answer);
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
      <label className="text-xs text-mute">Question</label>
      <DashField value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1" />
      <label className="mt-3 block text-xs text-mute">Answer</label>
      <DashTextarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} className="mt-1" />
      <div className="mt-3 flex gap-2">
        <DashBtn type="button" disabled={busy} onClick={() => onSave(question, answer)}>
          {busy ? "Saving…" : "Save"}
        </DashBtn>
        <DashBtn type="button" variant="ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </DashBtn>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const { refreshProjects } = useDashboard();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tab, setTab] = useState<KnowledgeSection>("faq");
  const [showEvalNotice, setShowEvalNotice] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const docRes = await api<{ documents: KnowledgeDoc[] }>(`/api/v1/projects/${id}/knowledge`, {
      token,
    });
    setDocs(docRes.documents);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  useEffect(() => {
    const busyDocs = docs.some((d) => d.status === "PENDING" || d.status === "PROCESSING");
    if (!busyDocs) return;
    const t = setInterval(() => load().catch(() => undefined), 2500);
    return () => clearInterval(t);
  }, [docs, load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const grouped = useMemo(() => {
    const onboarding: KnowledgeDoc[] = [];
    const documents: KnowledgeDoc[] = [];
    const faqRows: FaqRow[] = [];

    for (const doc of docs) {
      const kind = classifyKnowledgeDoc(doc);
      if (kind === "onboarding") onboarding.push(doc);
      else if (kind === "document") documents.push(doc);
      parseKnowledgeQa(doc.rawContent).forEach((pair, qaIndex) => {
        faqRows.push({ ...pair, docId: doc.id, docTitle: doc.title, qaIndex });
      });
    }
    return { onboarding, documents, faqRows };
  }, [docs]);

  function bumpEvalNotice() {
    setShowEvalNotice(true);
  }

  function openAdd(mode: AddMode) {
    setMenuOpen(false);
    setAddMode(mode);
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setAddMode(null);
  }

  async function submitAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !addMode) return;
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData(e.currentTarget);
      const title = String(fd.get("title") || "").trim();
      let content = "";
      let sourceType: "text" | "faq" | "file" = "text";

      if (addMode === "faq") {
        const question = String(fd.get("question") || "").trim();
        const answer = String(fd.get("answer") || "").trim();
        if (!question || !answer) throw new Error("Question and answer are required");
        content = `Q: ${question}\nA: ${answer}`;
        sourceType = "faq";
      } else {
        content = String(fd.get("content") || "").trim();
        if (!content) throw new Error("Content is required");
        sourceType = addMode === "file" ? "file" : "text";
      }

      await api(`/api/v1/projects/${id}/knowledge`, {
        method: "POST",
        token,
        body: JSON.stringify({ title, content, sourceType }),
      });
      closeAdd();
      setTab(addMode === "faq" ? "faq" : "document");
      bumpEvalNotice();
      setMsg("Queued for ingest — watch status below.");
      await load();
      await refreshProjects();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleFilePick(file: File) {
    const token = getStoredToken();
    if (!token) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["txt", "md", "csv", "json"].includes(ext)) {
      setMsg("Supported files: .txt, .md, .csv, .json");
      return;
    }
    setBusy(true);
    setUploadingFileName(file.name);
    setMsg("");
    try {
      const content = await file.text();
      if (!content.trim()) throw new Error("File is empty");
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;
      await api(`/api/v1/projects/${id}/knowledge`, {
        method: "POST",
        token,
        body: JSON.stringify({ title, content, sourceType: "file" }),
      });
      closeAdd();
      setTab("document");
      bumpEvalNotice();
      setMsg(`${file.name} queued for ingest.`);
      await load();
      await refreshProjects();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setUploadingFileName(null);
    }
  }

  async function retryDoc(docId: string) {
    const token = getStoredToken();
    if (!token) return;
    setRetryingId(docId);
    try {
      await api(`/api/v1/projects/${id}/knowledge/${docId}/retry`, { method: "POST", token });
      bumpEvalNotice();
      setMsg("Retry queued.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  async function deleteDoc(docId: string) {
    if (!confirm("Delete this item?")) return;
    const token = getStoredToken();
    if (!token) return;
    setDeletingId(docId);
    try {
      await api(`/api/v1/projects/${id}/knowledge/${docId}`, { method: "DELETE", token });
      bumpEvalNotice();
      await load();
      await refreshProjects();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveQa(row: FaqRow, question: string, answer: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/knowledge/${row.docId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ qaIndex: row.qaIndex, question, answer }),
      });
      setEditingKey(null);
      bumpEvalNotice();
      setMsg("Updated — re-ingesting…");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQa(row: FaqRow) {
    if (!confirm("Delete this Q&A?")) return;
    const token = getStoredToken();
    if (!token) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/knowledge/${row.docId}/qa`, {
        method: "DELETE",
        token,
        body: JSON.stringify({ qaIndex: row.qaIndex }),
      });
      bumpEvalNotice();
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const addTitle =
    addMode === "faq" ? "Add FAQ" : addMode === "text" ? "Add free text" : "Upload document";

  const tabs: { id: KnowledgeSection; label: string; count: number }[] = [
    { id: "onboarding", label: "Onboarding", count: grouped.onboarding.length },
    { id: "faq", label: "FAQs", count: grouped.faqRows.length },
    { id: "document", label: "Documents", count: grouped.documents.length },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-bold text-ink md:text-3xl">Knowledge</h1>
          <p className="mt-2 text-sm text-mute">Sources your chatbot answers from.</p>
        </div>
        <div className="relative" ref={menuRef}>
          <DashBtn type="button" onClick={() => setMenuOpen((o) => !o)} className="!gap-2">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add knowledge
            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
          </DashBtn>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-ink/[0.08] bg-white p-1 shadow-soft">
              <button
                type="button"
                onClick={() => openAdd("faq")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-clay"
              >
                <HelpCircle className="h-4 w-4 text-mute" strokeWidth={1.75} />
                FAQ
              </button>
              <button
                type="button"
                onClick={() => openAdd("text")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-clay"
              >
                <FileText className="h-4 w-4 text-mute" strokeWidth={1.75} />
                Free text
              </button>
              <button
                type="button"
                onClick={() => openAdd("file")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-clay"
              >
                <Upload className="h-4 w-4 text-mute" strokeWidth={1.75} />
                Upload file
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <p className="mt-4 rounded-xl border border-ink/[0.08] bg-clay px-4 py-3 text-sm text-ink">
          {msg}
        </p>
      )}

      {showEvalNotice && (
        <div className="mt-4">
          <EvalLaunchNotice projectId={id} visible />
        </div>
      )}

      <JobsBanner docs={docs} />

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setTab(s.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === s.id
                ? "border-ink bg-ink text-white"
                : "border-ink/15 bg-white text-ink hover:bg-clay"
            }`}
          >
            {s.label}
            <span className="ml-1.5 font-mono text-[11px] opacity-70">{s.count}</span>
          </button>
        ))}
      </div>

      {tab === "onboarding" && (
        <section className="mt-6 pb-4">
          <div className="space-y-3">
            {grouped.onboarding.length === 0 ? (
              <p className="rounded-2xl border border-ink/[0.08] bg-white py-10 text-center text-sm text-mute">
                No onboarding profile yet. Finish onboarding to seed business details.
              </p>
            ) : (
            grouped.onboarding.map((doc) => {
              const profile = parseProfileSections(doc.rawContent);
              const description = extractDescription(doc.rawContent);
              const qaPairs = parseKnowledgeQa(doc.rawContent);
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-sm font-bold text-ink">{doc.title}</h3>
                        <StatusPill status={doc.status} />
                      </div>
                      <p className="mt-1 text-xs text-mute">{statusLabel(doc.status)}</p>
                    </div>
                  </div>
                  {(profile.length > 0 || description) && (
                    <div className="mt-3 border-t border-ink/[0.06] pt-3 text-sm text-mute">
                      {profile.map((r) => (
                        <p key={r.label} className="mt-1 first:mt-0">
                          <span className="font-medium text-ink">{r.label}:</span> {r.value}
                        </p>
                      ))}
                      {description && (
                        <p className="mt-3 whitespace-pre-wrap leading-relaxed">{description}</p>
                      )}
                    </div>
                  )}
                  {qaPairs.length > 0 && (
                    <div className="mt-4 border-t border-ink/[0.06] pt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                        Onboarding Q&amp;A
                      </p>
                      <div className="mt-3 space-y-3">
                        {qaPairs.map((qa, idx) => (
                          <div key={idx} className="rounded-xl bg-clay/50 px-3 py-2.5">
                            <p className="text-sm font-semibold text-ink">{qa.question}</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-mute">{qa.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        </section>
      )}

      {tab === "faq" && (
      <section className="mt-6 pb-4">
        <div className="space-y-3">
          {grouped.faqRows.length === 0 ? (
            <p className="rounded-2xl border border-ink/[0.08] bg-white py-8 text-center text-sm text-mute">
              No FAQs yet. Use Add knowledge → FAQ.
            </p>
          ) : (
            grouped.faqRows.map((row) => {
              const key = `${row.docId}-${row.qaIndex}`;
              if (editingKey === key) {
                return (
                  <QaEditor
                    key={key}
                    pair={row}
                    busy={busy}
                    onCancel={() => setEditingKey(null)}
                    onSave={(q, a) => saveQa(row, q, a)}
                  />
                );
              }
              const parent = docs.find((d) => d.id === row.docId);
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{row.question}</p>
                        {parent && <StatusPill status={parent.status} />}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-mute">{row.answer}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingKey(key)}
                        className="rounded-lg p-2 text-mute hover:bg-clay hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteQa(row)}
                        className="rounded-lg p-2 text-mute hover:bg-clay hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      )}

      {tab === "document" && (
      <section className="mt-6 pb-4">
        <div className="space-y-3">
          {grouped.documents.length === 0 ? (
            <p className="rounded-2xl border border-ink/[0.08] bg-white py-8 text-center text-sm text-mute">
              No documents yet. Use Add knowledge → Free text or Upload file.
            </p>
          ) : (
            grouped.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-sm font-bold text-ink">{doc.title}</h3>
                      <StatusPill status={doc.status} />
                    </div>
                    <p className="mt-1 text-xs text-mute">
                      {doc.sourceType} · {statusLabel(doc.status)}
                      {typeof doc._count?.chunks === "number" ? ` · ${doc._count.chunks} chunks` : ""}
                    </p>
                    {doc.error && <p className="mt-1 text-xs text-red-600">{doc.error}</p>}
                    {(doc.status === "PENDING" || doc.status === "PROCESSING") && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-mute">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Ingest job in progress…
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {doc.status === "FAILED" && (
                      <DashBtn
                        type="button"
                        variant="ghost"
                        className="!px-3 !py-2 text-xs"
                        disabled={retryingId === doc.id}
                        onClick={() => retryDoc(doc.id)}
                      >
                        Retry
                      </DashBtn>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => deleteDoc(doc.id)}
                      className="rounded-lg p-2 text-mute hover:bg-clay hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {/* Add modal */}
      <Transition show={addOpen} as={Fragment}>
        <Dialog onClose={closeAdd} className="relative z-50">
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
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <DialogPanel className="w-full max-w-md rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
                <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
                  <DialogTitle className="font-sans text-base font-bold text-ink">
                    {addTitle}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={closeAdd}
                    className="rounded-lg p-2 text-mute hover:bg-clay hover:text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>

                {addMode === "file" ? (
                  <div className="space-y-4 p-5">
                    <p className="text-sm text-mute">
                      Upload a company document (.txt, .md, .csv, .json). We&apos;ll queue it for
                      ingest.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.csv,.json,text/plain,text/markdown"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFilePick(f);
                        e.target.value = "";
                      }}
                    />
                    {uploadingFileName ? (
                      <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-clay/50 px-4 py-3">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-mute" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{uploadingFileName}</p>
                          <p className="text-xs text-mute">Uploading and queuing for ingest…</p>
                        </div>
                      </div>
                    ) : (
                      <DashBtn
                        type="button"
                        disabled={busy}
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose file
                      </DashBtn>
                    )}
                  </div>
                ) : (
                  <form onSubmit={submitAdd} className="space-y-4 p-5">
                    <div>
                      <label className="text-xs text-mute">Title</label>
                      <DashField
                        name="title"
                        required
                        className="mt-1"
                        placeholder={addMode === "faq" ? "Support hours" : "Document title"}
                      />
                    </div>
                    {addMode === "faq" ? (
                      <>
                        <div>
                          <label className="text-xs text-mute">Question</label>
                          <DashField name="question" required className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-mute">Answer</label>
                          <DashTextarea name="answer" required rows={4} className="mt-1" />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="text-xs text-mute">Content</label>
                        <DashTextarea name="content" required rows={7} className="mt-1" />
                      </div>
                    )}
                    <DashBtn type="submit" disabled={busy} className="w-full">
                      {busy ? "Queuing…" : "Add to knowledge"}
                    </DashBtn>
                  </form>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
