import type { Redis } from "ioredis";
export declare function normalizeQuery(q: string): string;
export declare function cacheKey(projectId: string, query: string): string;
export declare function getCachedAnswer(redis: Redis, projectId: string, query: string): Promise<string | null>;
export declare function setCachedAnswer(redis: Redis, projectId: string, query: string, answer: string, ttlSeconds?: number): Promise<void>;
export declare function getSessionMemory(redis: Redis, sessionId: string): Promise<string[]>;
export declare function pushSessionMemory(redis: Redis, sessionId: string, turn: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map