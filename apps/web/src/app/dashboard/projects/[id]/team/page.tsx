"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, UserMinus, UserPlus } from "lucide-react";
import { api, getStoredToken } from "@/lib/api";
import { PLAN_LIMITS, type MemberRole } from "@quickstart-ai/shared";
import { DashBtn, DashField, DashPanel } from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardContext";

type MemberRow = {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  isOwner: boolean;
  user: { id: string; name: string; email: string };
};

type InviteRow = {
  id: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
};

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, refreshProjects } = useDashboard();
  const project = projects.find((p) => p.id === id);
  const plan = (project?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const teamLimit = PLAN_LIMITS[plan]?.teamMembers ?? 1;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const token = getStoredToken() ?? undefined;
    const [m, i] = await Promise.all([
      api<{ members: MemberRow[] }>(`/api/v1/projects/${id}/members`, { token }),
      api<{ invites: InviteRow[] }>(`/api/v1/projects/${id}/invites`, { token }),
    ]);
    setMembers(m.members);
    setInvites(i.invites);
  }, [id]);

  useEffect(() => {
    void load().catch((e) => setErr(e instanceof Error ? e.message : "Failed to load team"));
  }, [load]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!id || !email.trim()) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api<{ inviteUrl?: string }>(`/api/v1/projects/${id}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), role }),
        token: getStoredToken() ?? undefined,
      });
      setEmail("");
      setMsg(
        res.inviteUrl
          ? `Invite created. Dev link: ${res.inviteUrl}`
          : "Invite sent by email.",
      );
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send invite");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!id || !confirm("Remove this teammate from the project?")) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/members/${userId}`, {
        method: "DELETE",
        token: getStoredToken() ?? undefined,
      });
      await load();
      await refreshProjects();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove member");
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    if (!id) return;
    setBusy(true);
    try {
      await api(`/api/v1/projects/${id}/invites/${inviteId}`, {
        method: "DELETE",
        token: getStoredToken() ?? undefined,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not cancel invite");
    } finally {
      setBusy(false);
    }
  }

  async function resendInvite(inviteId: string) {
    if (!id) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await api<{ inviteUrl?: string }>(
        `/api/v1/projects/${id}/invites/${inviteId}/resend`,
        { method: "POST", token: getStoredToken() ?? undefined },
      );
      setMsg(
        res.inviteUrl ? `Invite resent. Dev link: ${res.inviteUrl}` : "Invite resent by email.",
      );
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not resend invite");
    } finally {
      setBusy(false);
    }
  }

  const atCap = members.length + invites.length >= teamLimit;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold text-ink">Team</h1>
      <p className="mt-1 text-sm text-mute">
        Invite teammates to monitor conversations and handle inbox escalations.
      </p>

      {err && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</p>
      )}
      {msg && (
        <p className="mt-4 rounded-lg bg-clay px-3 py-2 text-sm text-ink break-all">{msg}</p>
      )}

      <DashPanel className="mt-6">
        <h2 className="font-sans text-sm font-bold text-ink">Members</h2>
        <ul className="mt-4 divide-y divide-ink/[0.06]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{m.user.name}</p>
                <p className="truncate text-xs text-mute">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-clay px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">
                  {m.role}
                </span>
                {!m.isOwner && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeMember(m.userId)}
                    className="rounded-lg p-1.5 text-mute transition hover:bg-clay hover:text-red-600"
                    title="Remove member"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DashPanel>

      <DashPanel className="mt-6">
        <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-ink">
          <UserPlus className="h-4 w-4" />
          Invite teammate
        </h2>
        {atCap ? (
          <p className="mt-3 text-sm text-mute">
            Your {plan} plan allows up to {teamLimit} team member
            {teamLimit === 1 ? "" : "s"}. Upgrade to invite more people.
          </p>
        ) : (
          <form onSubmit={invite} className="mt-4 space-y-3">
            <DashField
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "agent")}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
            >
              <option value="agent">Agent — inbox & conversations only</option>
              <option value="admin">Admin — manage knowledge & settings</option>
            </select>
            <DashBtn type="submit" disabled={busy}>
              Send invite
            </DashBtn>
          </form>
        )}
      </DashPanel>

      {invites.length > 0 && (
        <DashPanel className="mt-6">
          <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-ink">
            <Mail className="h-4 w-4" />
            Pending invites
          </h2>
          <ul className="mt-4 divide-y divide-ink/[0.06]">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{inv.email}</p>
                  <p className="text-xs text-mute">
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <DashBtn
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy}
                    onClick={() => void resendInvite(inv.id)}
                  >
                    Resend
                  </DashBtn>
                  <DashBtn
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy}
                    onClick={() => void cancelInvite(inv.id)}
                  >
                    Cancel
                  </DashBtn>
                </div>
              </li>
            ))}
          </ul>
        </DashPanel>
      )}
    </div>
  );
}
