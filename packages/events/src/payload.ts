import type { EventEnvelope } from "./types.js";

const API_VERSION = "2026-08-11";

export function buildEventEnvelope(input: {
  id: string;
  type: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: Date;
  data: Record<string, unknown>;
}): EventEnvelope {
  return {
    id: input.id,
    type: input.type,
    name: input.name,
    description: input.description,
    created_at: input.createdAt.toISOString(),
    project_id: input.projectId,
    api_version: API_VERSION,
    data: input.data,
  };
}
