-- Add allow_anonymous_sessions to Project (safe additive migration)
ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "allowAnonymousSessions" BOOLEAN NOT NULL DEFAULT false;
