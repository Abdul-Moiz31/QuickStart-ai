-- CustomTool table for Issue #16
CREATE TABLE IF NOT EXISTS "CustomTool" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "httpMethod" TEXT NOT NULL DEFAULT 'POST',
  url TEXT NOT NULL,
  "authHeaderEnc" TEXT,
  parameters JSONB NOT NULL DEFAULT '[]',
  "responseKey" TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("projectId", name)
);

CREATE INDEX IF NOT EXISTS "CustomTool_projectId_idx" ON "CustomTool"("projectId");
