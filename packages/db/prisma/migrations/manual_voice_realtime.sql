-- Realtime voice (Gemini Live) — Sprint 1 schema additions
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceProvider" TEXT NOT NULL DEFAULT 'gemini_live';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash-native-audio';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceName" TEXT NOT NULL DEFAULT 'Puck';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceInstructionsExtra" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "voiceFallbackMode" TEXT NOT NULL DEFAULT 'transcribe';

CREATE TABLE IF NOT EXISTS "VoiceSessionRecord" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "chatSessionId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'gemini_live',
  "mode" TEXT NOT NULL DEFAULT 'realtime',
  "status" TEXT NOT NULL DEFAULT 'starting',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  "turnCount" INTEGER NOT NULL DEFAULT 0,
  "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  "errorCode" TEXT,
  "meta" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "VoiceSessionRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VoiceSessionRecord_projectId_startedAt_idx"
  ON "VoiceSessionRecord"("projectId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "VoiceSessionRecord_status_idx"
  ON "VoiceSessionRecord"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VoiceSessionRecord_projectId_fkey'
  ) THEN
    ALTER TABLE "VoiceSessionRecord"
      ADD CONSTRAINT "VoiceSessionRecord_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
