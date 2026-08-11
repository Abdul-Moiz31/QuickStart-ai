#!/usr/bin/env tsx
/**
 * Legacy Mongo → QuickStart Postgres migration (dual-run helper).
 *
 * Reads users from the old Mongoose shape and creates:
 *  - User + default Project + ApiCredential
 *  - KnowledgeDocument from bussinessDetails Q&A pairs
 *
 * Usage:
 *   LEGACY_MONGODB_URI=... DATABASE_URL=... pnpm --filter @quickstart-ai/api exec tsx ../../scripts/migrate-legacy.ts
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const legacyUri = process.env.LEGACY_MONGODB_URI || process.env.MONGODB_URI;
  if (!legacyUri) {
    console.error("Set LEGACY_MONGODB_URI");
    process.exit(1);
  }

  // Dynamic import after env load
  const { prisma, ensurePgvector } = await import("../packages/db/src/index.js");
  const { generateClientId, generateClientSecret, hashSecret } = await import(
    "../apps/api/src/credentials.js"
  );
  const { chunkText, createEmbeddingsClient, storeChunkEmbeddings } = await import(
    "../packages/rag/src/index.js"
  );

  await prisma.$connect();
  await ensurePgvector();
  await mongoose.connect(legacyUri);

  const LegacyUser = mongoose.connection.collection("users");
  const users = await LegacyUser.find({}).toArray();
  console.log(`Found ${users.length} legacy users`);

  for (const u of users) {
    const email = String(u.email || "").toLowerCase();
    if (!email) continue;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`skip existing ${email}`);
      continue;
    }

    const passwordHash =
      typeof u.password === "string" && u.password.startsWith("$2")
        ? u.password
        : await bcrypt.hash("ChangeMe123!", 12);

    const user = await prisma.user.create({
      data: {
        name: String(u.name || email),
        email,
        passwordHash,
        role: u.role === "admin" ? "ADMIN" : "USER",
      },
    });

    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: String(u.bussinessName || `${user.name}'s Project`),
        description: String(u.bussinessDescription || ""),
        category: String(u.bussinessCategory || ""),
      },
    });

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    await prisma.apiCredential.create({
      data: {
        projectId: project.id,
        clientId,
        clientSecretHash: hashSecret(clientSecret),
        label: "migrated",
      },
    });

    const details = Array.isArray(u.bussinessDetails) ? u.bussinessDetails : [];
    if (details.length) {
      const content = details
        .map((d: { question?: string; answer?: string }) => `Q: ${d.question}\nA: ${d.answer}`)
        .join("\n\n");
      const doc = await prisma.knowledgeDocument.create({
        data: {
          projectId: project.id,
          title: "Migrated FAQ",
          sourceType: "faq",
          rawContent: content,
          status: "PROCESSING",
        },
      });
      const chunks = chunkText(content);
      const created = await prisma.$transaction(
        chunks.map((c, chunkIndex) =>
          prisma.knowledgeChunk.create({
            data: {
              documentId: doc.id,
              projectId: project.id,
              content: c,
              chunkIndex,
              tokenCount: Math.ceil(c.length / 4),
            },
          }),
        ),
      );
      const embeddings = createEmbeddingsClient();
      const vectors = await embeddings.embed(chunks);
      await storeChunkEmbeddings(
        created.map((c) => c.id),
        vectors,
      );
      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: "READY" },
      });
    }

    console.log(`migrated ${email} → project ${project.id} client_id=${clientId}`);
  }

  await mongoose.disconnect();
  await prisma.$disconnect();
  console.log("Migration complete. Dual-run: point widgets to new API when ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
