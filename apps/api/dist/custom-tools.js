export function parseCustomToolParameters(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((p) => {
        return (p &&
            typeof p === "object" &&
            typeof p.name === "string" &&
            typeof p.description === "string");
    })
        .map((p) => ({
        name: p.name,
        description: p.description,
        required: p.required !== false,
    }));
}
export function toCustomToolRuntime(row) {
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
export function serializeCustomTool(row) {
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
//# sourceMappingURL=custom-tools.js.map