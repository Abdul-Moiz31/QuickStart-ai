import { BUILTIN_EVENT_TYPES } from "@quickstart-ai/shared";
function accentColor(type) {
    if (type === BUILTIN_EVENT_TYPES.LEAD_CAPTURED)
        return 0x2ecc71;
    if (type === BUILTIN_EVENT_TYPES.HUMAN_HANDOFF)
        return 0xf39c12;
    if (type === BUILTIN_EVENT_TYPES.ISSUE_REPORTED)
        return 0xe74c3c;
    if (type === BUILTIN_EVENT_TYPES.KNOWLEDGE_GAP)
        return 0x95a5a6;
    return 0x5865f2;
}
export function formatDiscordMessage(envelope) {
    const data = envelope.data;
    const visitor = data.visitor ?? {};
    const conversationUrl = data.conversation_url;
    const lines = [envelope.description];
    if (visitor.name)
        lines.push(`**Name:** ${visitor.name}`);
    if (visitor.email)
        lines.push(`**Email:** ${visitor.email}`);
    if (data.message)
        lines.push(`**Message:** ${String(data.message).slice(0, 300)}`);
    if (data.reason)
        lines.push(`**Reason:** ${String(data.reason)}`);
    if (data.summary)
        lines.push(`**Summary:** ${String(data.summary).slice(0, 300)}`);
    const embed = {
        title: envelope.name,
        description: lines.join("\n"),
        color: accentColor(envelope.type),
        timestamp: envelope.created_at,
    };
    if (conversationUrl) {
        embed.url = conversationUrl;
    }
    return {
        embeds: [embed],
    };
}
export async function postToDiscord(webhookUrl, body) {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Discord delivery failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.status;
}
//# sourceMappingURL=discord.js.map