-- Event system tables (manual migration to avoid unrelated schema drift)

CREATE TABLE IF NOT EXISTS "ProjectEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL,
  "sessionId" TEXT,
  "idempotencyKey" TEXT UNIQUE,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ProjectEvent_projectId_createdAt_idx" ON "ProjectEvent"("projectId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ProjectEvent_projectId_type_createdAt_idx" ON "ProjectEvent"("projectId", "type", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL DEFAULT 'Webhook',
  "description" TEXT NOT NULL DEFAULT '',
  "url" TEXT NOT NULL,
  "secretEnc" TEXT NOT NULL,
  "events" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookEndpoint_projectId_idx" ON "WebhookEndpoint"("projectId");

CREATE TABLE IF NOT EXISTS "IntegrationConnection" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Slack',
  "description" TEXT NOT NULL DEFAULT '',
  "configEnc" TEXT NOT NULL,
  "events" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IntegrationConnection_projectId_provider_idx" ON "IntegrationConnection"("projectId", "provider");

CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES "ProjectEvent"("id") ON DELETE CASCADE,
  "endpointId" UUID REFERENCES "WebhookEndpoint"("id") ON DELETE SET NULL,
  "integrationId" UUID REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "responseCode" INTEGER,
  "nextRetryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");

CREATE TABLE IF NOT EXISTS "EventRule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "eventType" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "triggers" JSONB NOT NULL DEFAULT '{}',
  "destinations" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EventRule_projectId_enabled_idx" ON "EventRule"("projectId", "enabled");
