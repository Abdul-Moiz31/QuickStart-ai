import mongoose, { type InferSchemaType, type Model } from "mongoose";
declare const messageSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    meta: any;
    role: "user" | "assistant" | "system" | "tool" | "agent";
    content: string;
    toolName?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    meta: any;
    role: "user" | "assistant" | "system" | "tool" | "agent";
    content: string;
    toolName?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    meta: any;
    role: "user" | "assistant" | "system" | "tool" | "agent";
    content: string;
    toolName?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
declare const sessionSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    projectId: string;
    metadata: any;
    visitorName: string;
    visitorEmail: string;
    messages: mongoose.Types.DocumentArray<{
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps> & {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps>;
    memorySummary: string;
    humanPending: boolean;
    humanActive: boolean;
    agentId?: string | null | undefined;
    escalatedAt?: NativeDate | null | undefined;
    takenOverAt?: NativeDate | null | undefined;
    releasedAt?: NativeDate | null | undefined;
    agentLastActiveAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    projectId: string;
    metadata: any;
    visitorName: string;
    visitorEmail: string;
    messages: mongoose.Types.DocumentArray<{
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps> & {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps>;
    memorySummary: string;
    humanPending: boolean;
    humanActive: boolean;
    agentId?: string | null | undefined;
    escalatedAt?: NativeDate | null | undefined;
    takenOverAt?: NativeDate | null | undefined;
    releasedAt?: NativeDate | null | undefined;
    agentLastActiveAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    projectId: string;
    metadata: any;
    visitorName: string;
    visitorEmail: string;
    messages: mongoose.Types.DocumentArray<{
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps> & {
        meta: any;
        role: "user" | "assistant" | "system" | "tool" | "agent";
        content: string;
        toolName?: string | null | undefined;
    } & mongoose.DefaultTimestampProps>;
    memorySummary: string;
    humanPending: boolean;
    humanActive: boolean;
    agentId?: string | null | undefined;
    escalatedAt?: NativeDate | null | undefined;
    takenOverAt?: NativeDate | null | undefined;
    releasedAt?: NativeDate | null | undefined;
    agentLastActiveAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type ChatMessageDoc = InferSchemaType<typeof messageSchema>;
export type ChatSessionDoc = InferSchemaType<typeof sessionSchema> & {
    _id: mongoose.Types.ObjectId;
};
export type ChatSessionModel = Model<ChatSessionDoc>;
/**
 * Session ids arrive from URLs, including public widget routes. Passing a
 * malformed one to findById throws a Mongoose CastError, which surfaces as a 500
 * rather than the 404 the caller deserves.
 */
export declare function isValidSessionId(id: string): boolean;
export declare function getChatSessionModel(): ChatSessionModel;
export declare function connectMongo(uri?: string | undefined): Promise<typeof mongoose>;
export declare function isMongoReady(): boolean;
export {};
//# sourceMappingURL=mongo.d.ts.map