import { env } from "../env.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  sent: boolean;
  /** Set when email was not sent (dev fallback). */
  devPreviewUrl?: string;
};

export async function sendEmail(
  input: SendEmailInput,
  log?: { info: (obj: unknown, msg?: string) => void },
): Promise<SendEmailResult> {
  if (!env.resendApiKey) {
    log?.info({ to: input.to, subject: input.subject }, "[mail] RESEND_API_KEY missing — email not sent");
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.mailFrom,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  return { sent: true };
}

export async function sendProjectInviteEmail(opts: {
  to: string;
  projectName: string;
  role: string;
  inviteUrl: string;
  inviterName?: string;
  log?: { info: (obj: unknown, msg?: string) => void };
}): Promise<SendEmailResult> {
  const inviter = opts.inviterName ? `${opts.inviterName} has` : "You've been";
  const subject = `Join ${opts.projectName} on QuickStart AI`;
  const html = `
    <p>${inviter} invited you to join <strong>${opts.projectName}</strong> as <strong>${opts.role}</strong>.</p>
    <p><a href="${opts.inviteUrl}">Accept invitation</a></p>
    <p>This link expires in 24 hours.</p>
  `.trim();
  const text = `${inviter} invited you to join ${opts.projectName} as ${opts.role}. Accept: ${opts.inviteUrl} (expires in 24 hours)`;

  const result = await sendEmail(
    { to: opts.to, subject, html, text },
    opts.log,
  );

  if (!result.sent) {
    opts.log?.info({ inviteUrl: opts.inviteUrl, email: opts.to }, "[mail] invite link (dev)");
    return { sent: false, devPreviewUrl: opts.inviteUrl };
  }

  return result;
}
