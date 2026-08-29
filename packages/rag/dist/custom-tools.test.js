import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { executeCustomTool, formatCustomToolDescription, } from "./custom-tools.js";
const baseTool = {
    id: "tool-1",
    projectId: "proj-1",
    name: "check_order_status",
    description: "Look up order status",
    httpMethod: "POST",
    url: "https://api.example.com/orders",
    parameters: [
        { name: "order_number", description: "Order ID", required: true },
    ],
    responseKey: "status",
    enabled: true,
};
describe("formatCustomToolDescription", () => {
    it("appends parameter hints", () => {
        const text = formatCustomToolDescription(baseTool);
        expect(text).toContain("order_number (required)");
        expect(text).toContain("Look up order status");
    });
});
describe("executeCustomTool", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn(async () => Response.json({ status: "shipped" }, { status: 200 })));
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });
    it("returns extracted response key value", async () => {
        const result = await executeCustomTool(baseTool, { order_number: "123" }, { projectId: "proj-1", applyRateLimit: false });
        expect(result.output).toBe("shipped");
        expect(result.statusCode).toBe(200);
    });
    it("returns graceful error on HTTP failure", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
        const result = await executeCustomTool(baseTool, { order_number: "123" }, { projectId: "proj-1", applyRateLimit: false });
        expect(result.output).toContain("Lookup failed");
        expect(result.output).toContain("500");
    });
});
//# sourceMappingURL=custom-tools.test.js.map