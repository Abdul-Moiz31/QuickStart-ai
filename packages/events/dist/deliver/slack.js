import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
export function formatSlackMessage(envelope) {
    const data = envelope.data;
    const visitor = data.visitor ?? {};
    const conversationUrl = data.conversation_url;
    const inboxUrl = data.inbox_url;
    const blocks = [
        {
            type: "header",
            text: { type: "plain_text", text: `${envelope.name}`, emoji: true },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: envelope.description,
            },
        },
    ];
    const fields = [];
    if (visitor.name)
        fields.push({ type: "mrkdwn", text: `*Name:*\n${visitor.name}` });
    if (visitor.email)
        fields.push({ type: "mrkdwn", text: `*Email:*\n${visitor.email}` });
    if (data.message)
        fields.push({ type: "mrkdwn", text: `*Message:*\n${String(data.message).slice(0, 200)}` });
    if (data.reason)
        fields.push({ type: "mrkdwn", text: `*Reason:*\n${String(data.reason)}` });
    if (data.summary)
        fields.push({ type: "mrkdwn", text: `*Summary:*\n${String(data.summary).slice(0, 200)}` });
    if (fields.length) {
        blocks.push({ type: "section", fields });
    }
    // The handoff notification is where someone decides whether to step in, so it
    // leads with the action that lets them: replying. The read-only conversation
    // view stays available beside it.
    const actions = [];
    if (inboxUrl) {
        actions.push({
            type: "button",
            style: "primary",
            text: { type: "plain_text", text: "Reply in inbox" },
            url: inboxUrl,
        });
    }
    if (conversationUrl) {
        actions.push({
            type: "button",
            text: { type: "plain_text", text: "View conversation" },
            url: conversationUrl,
        });
    }
    if (actions.length) {
        blocks.push({ type: "actions", elements: actions });
    }
    const emoji = envelope.type === BUILTIN_EVENT_TYPES.LEAD_CAPTURED
        ? "🎯"
        : envelope.type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF
            ? "🙋"
            : envelope.type === BUILTIN_EVENT_TYPES.ISSUE_REPORTED
                ? "🐛"
                : envelope.type === BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP
                    ? "❓"
                    : "💬";
    return {
        text: `${emoji} ${envelope.name}`,
        blocks,
    };
}
export async function postToSlack(webhookUrl, body) {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Slack delivery failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.status;
}
//# sourceMappingURL=slack.js.map