import mongoose, { Schema } from "mongoose";
const messageSchema = new Schema({
    role: { type: String, enum: ["user", "assistant", "system", "tool", "agent"], required: true },
    content: { type: String, required: true },
    toolName: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
const sessionSchema = new Schema({
    projectId: { type: String, required: true, index: true },
    visitorName: { type: String, required: true },
    visitorEmail: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    memorySummary: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    /** Escalation is waiting for a human to pick it up. Drives the inbox queue. */
    humanPending: { type: Boolean, default: false },
    /** A human holds the conversation right now. The bot must not reply. */
    humanActive: { type: Boolean, default: false },
    /** Dashboard user who took the session over. */
    agentId: { type: String },
    escalatedAt: { type: Date },
    takenOverAt: { type: Date },
    releasedAt: { type: Date },
    /** Last agent write — the auto-release sweep uses this to detect abandonment. */
    agentLastActiveAt: { type: Date },
}, { timestamps: true });
// The inbox lists pending and active sessions for one project on every poll and
// SSE reconnect, so both flags are indexed alongside projectId.
sessionSchema.index({ projectId: 1, humanPending: 1, updatedAt: -1 });
sessionSchema.index({ projectId: 1, humanActive: 1, updatedAt: -1 });
let ChatSession;
/**
 * Session ids arrive from URLs, including public widget routes. Passing a
 * malformed one to findById throws a Mongoose CastError, which surfaces as a 500
 * rather than the 404 the caller deserves.
 */
export function isValidSessionId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}
export function getChatSessionModel() {
    if (ChatSession)
        return ChatSession;
    ChatSession =
        mongoose.models.ChatSession ??
            mongoose.model("ChatSession", sessionSchema);
    return ChatSession;
}
let mongoReady = null;
export async function connectMongo(uri = process.env.MONGODB_URI) {
    if (!uri)
        throw new Error("MONGODB_URI is required");
    if (mongoose.connection.readyState === 1)
        return mongoose;
    if (!mongoReady) {
        mongoReady = mongoose.connect(uri);
    }
    return mongoReady;
}
export function isMongoReady() {
    return mongoose.connection.readyState === 1;
}
//# sourceMappingURL=mongo.js.map