import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system", "tool"], required: true },
    content: { type: String, required: true },
    toolName: { type: String },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const sessionSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    visitorName: { type: String, required: true },
    visitorEmail: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    memorySummary: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type ChatMessageDoc = InferSchemaType<typeof messageSchema>;
export type ChatSessionDoc = InferSchemaType<typeof sessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ChatSessionModel = Model<ChatSessionDoc>;

let ChatSession: ChatSessionModel;

export function getChatSessionModel(): ChatSessionModel {
  if (ChatSession) return ChatSession;
  ChatSession =
    (mongoose.models.ChatSession as ChatSessionModel | undefined) ??
    mongoose.model<ChatSessionDoc>("ChatSession", sessionSchema);
  return ChatSession;
}

let mongoReady: Promise<typeof mongoose> | null = null;

export async function connectMongo(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error("MONGODB_URI is required");
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!mongoReady) {
    mongoReady = mongoose.connect(uri);
  }
  return mongoReady;
}
