-- Team & multi-agent access: ProjectMember + ProjectInvite

CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'agent');

CREATE TABLE "ProjectMember" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "MemberRole" NOT NULL DEFAULT 'agent',
  "invitedBy" UUID,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

CREATE TABLE "ProjectInvite" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "MemberRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedBy" UUID NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProjectInvite_tokenHash_key" ON "ProjectInvite"("tokenHash");
CREATE INDEX "ProjectInvite_projectId_idx" ON "ProjectInvite"("projectId");
CREATE INDEX "ProjectInvite_email_idx" ON "ProjectInvite"("email");

-- Backfill owners as ProjectMember rows
INSERT INTO "ProjectMember" ("id", "projectId", "userId", "role", "joinedAt", "createdAt")
SELECT gen_random_uuid(), "id", "ownerId", 'owner', "createdAt", "createdAt"
FROM "Project";
