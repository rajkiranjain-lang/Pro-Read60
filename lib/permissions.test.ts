import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("RBAC", () => {
  it("denies admin permissions to normal users", () => {
    expect(hasPermission("USER", "users.ban")).toBe(false);
    expect(hasPermission("USER", "settings.write")).toBe(false);
  });
  it("gives moderators moderation permissions but not platform settings", () => {
    expect(hasPermission("MODERATOR", "reports.resolve")).toBe(true);
    expect(hasPermission("MODERATOR", "settings.write")).toBe(false);
  });
  it("gives super admins complete control", () => {
    expect(hasPermission("SUPER_ADMIN", "roles.write")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "features.write")).toBe(true);
  });
});
