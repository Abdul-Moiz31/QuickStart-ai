import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensurePgvector() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "KnowledgeChunk"
    ADD COLUMN IF NOT EXISTS embedding vector(1536)
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "KnowledgeChunk"
    ADD COLUMN IF NOT EXISTS content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw
    ON "KnowledgeChunk"
    USING hnsw (embedding vector_cosine_ops)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS knowledge_chunk_tsv_gin
    ON "KnowledgeChunk"
    USING gin (content_tsv)
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "llmProvider" TEXT NOT NULL DEFAULT 'platform'
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "useOwnLlmKey" BOOLEAN NOT NULL DEFAULT false
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "llmApiKeyEnc" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "llmModel" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Project"
    ADD COLUMN IF NOT EXISTS "llmBaseUrl" TEXT
  `);
}
