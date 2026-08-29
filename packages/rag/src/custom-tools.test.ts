import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  applyUrlPathParams,
  executeCustomTool,
  formatCustomToolDescription,
  type CustomToolRuntime,
} from "./custom-tools.js";

const baseTool: CustomToolRuntime = {
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ status: "shipped" }, { status: 200 }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns extracted response key value", async () => {
    const result = await executeCustomTool(
      baseTool,
      { order_number: "123" },
      { projectId: "proj-1", applyRateLimit: false },
    );
    expect(result.output).toBe("shipped");
    expect(result.statusCode).toBe(200);
  });

  it("returns graceful error on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    const result = await executeCustomTool(
      baseTool,
      { order_number: "123" },
      { projectId: "proj-1", applyRateLimit: false },
    );
    expect(result.output).toContain("Lookup failed");
    expect(result.output).toContain("500");
  });

  it("substitutes path parameters in GET URLs", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ title: "Essence Mascara" }, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await executeCustomTool(
      {
        ...baseTool,
        name: "get_product",
        httpMethod: "GET",
        url: "https://dummyjson.com/products/{product_id}",
        responseKey: "title",
      },
      { product_id: "1" },
      { projectId: "proj-1", applyRateLimit: false },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://dummyjson.com/products/1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.output).toBe("Essence Mascara");
  });
});

describe("applyUrlPathParams", () => {
  it("replaces placeholders and removes used args", () => {
    const result = applyUrlPathParams("https://api.example.com/products/{product_id}", {
      product_id: "42",
      extra: "keep",
    });
    expect(result).toEqual({
      url: "https://api.example.com/products/42",
      remainingArgs: { extra: "keep" },
    });
  });

  it("returns error when a path param is missing", () => {
    const result = applyUrlPathParams("https://api.example.com/products/{product_id}", {});
    expect(result).toEqual({ error: 'Lookup failed: missing URL parameter "product_id".' });
  });
});
