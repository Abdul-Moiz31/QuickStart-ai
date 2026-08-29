import { describe, expect, it } from "vitest";
import { roleAtLeast, canManageTeam } from "./member-role.js";

describe("member-role", () => {
  it("roleAtLeast respects hierarchy", () => {
    expect(roleAtLeast("owner", "agent")).toBe(true);
    expect(roleAtLeast("admin", "agent")).toBe(true);
    expect(roleAtLeast("agent", "admin")).toBe(false);
    expect(roleAtLeast("admin", "owner")).toBe(false);
  });

  it("canManageTeam allows admin and owner", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("agent")).toBe(false);
  });
});
