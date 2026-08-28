import type { CustomTool } from "@quickstart-ai/db";
import type { CustomToolRuntime } from "@quickstart-ai/rag";
import type { CustomToolParameter } from "@quickstart-ai/shared";

export function parseCustomToolParameters(raw: unknown): CustomToolParameter[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is CustomToolParameter => {
      return (
        p &&
        typeof p === "object" &&
        typeof (p as CustomToolParameter).name === "string" &&
        typeof (p as CustomToolParameter).description === "string"
      );
    })
    .map((p) => ({
      name: p.name,
      description: p.description,
      required: p.required !== false,
    }));
}

export function toCustomToolRuntime(row: CustomTool): CustomToolRuntime {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    httpMethod: row.httpMethod,
    url: row.url,
    authHeaderEnc: row.authHeaderEnc,
    parameters: parseCustomToolParameters(row.parameters),
    responseKey: row.responseKey,
    enabled: row.enabled,
  };
}

export function serializeCustomTool(row: CustomTool) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    httpMethod: row.httpMethod,
    url: row.url,
    parameters: parseCustomToolParameters(row.parameters),
    responseKey: row.responseKey,
    enabled: row.enabled,
    hasAuthHeader: Boolean(row.authHeaderEnc),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
