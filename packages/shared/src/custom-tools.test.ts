import { describe, expect, it } from "vitest";
import {
  createCustomToolSchema,
  customToolParameterSchema,
  testCustomToolSchema,
  updateCustomToolSchema,
} from "./schemas.js";

describe("customToolParameterSchema", () => {
  it("accepts a valid parameter", () => {
    const result = customToolParameterSchema.safeParse({
      name: "order_number",
      description: "The order ID the customer mentioned",
      required: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-snake_case names", () => {
    const result = customToolParameterSchema.safeParse({
      name: "OrderNumber",
      description: "bad",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCustomToolSchema", () => {
  it("accepts a minimal POST tool", () => {
    const result = createCustomToolSchema.safeParse({
      name: "check_order_status",
      description: "Look up order status by order number",
      url: "https://shop.example.com/api/order-status",
      parameters: [{ name: "order_number", description: "Order ID", required: true }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.httpMethod).toBe("POST");
      expect(result.data.enabled).toBe(true);
    }
  });

  it("rejects invalid tool names", () => {
    const result = createCustomToolSchema.safeParse({
      name: "Check Order",
      description: "bad",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCustomToolSchema", () => {
  it("allows clearing auth with null", () => {
    const result = updateCustomToolSchema.safeParse({ authHeader: null });
    expect(result.success).toBe(true);
  });
});

describe("testCustomToolSchema", () => {
  it("defaults args to empty object", () => {
    const result = testCustomToolSchema.parse({});
    expect(result.args).toEqual({});
  });
});
