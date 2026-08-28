import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_VISITOR_NAME,
  generateAnonymousVisitorEmail,
  isAnonymousVisitor,
  resolveVisitorIdentity,
} from "./constants.js";

describe("resolveVisitorIdentity", () => {
  it("requires both fields when anonymous is disabled", () => {
    expect(() => resolveVisitorIdentity({}, false)).toThrow(/required/i);
    expect(() =>
      resolveVisitorIdentity({ visitorName: "Ada", visitorEmail: "ada@test.com" }, false),
    ).not.toThrow();
  });

  it("rejects partial identity", () => {
    expect(() => resolveVisitorIdentity({ visitorName: "Ada" }, true)).toThrow(/both name and email/i);
  });

  it("generates anonymous identity when allowed and body empty", () => {
    const resolved = resolveVisitorIdentity({}, true);
    expect(resolved.anonymous).toBe(true);
    expect(resolved.visitorName).toBe(ANONYMOUS_VISITOR_NAME);
    expect(isAnonymousVisitor(resolved.visitorEmail)).toBe(true);
  });

  it("uses provided identity when both fields present", () => {
    const resolved = resolveVisitorIdentity(
      { visitorName: "Ada Lovelace", visitorEmail: "ada@test.com" },
      true,
    );
    expect(resolved.anonymous).toBe(false);
    expect(resolved.visitorName).toBe("Ada Lovelace");
    expect(resolved.visitorEmail).toBe("ada@test.com");
  });
});

describe("isAnonymousVisitor", () => {
  it("matches anon placeholder emails", () => {
    expect(isAnonymousVisitor(generateAnonymousVisitorEmail())).toBe(true);
    expect(isAnonymousVisitor("guest@example.com")).toBe(false);
  });
});
