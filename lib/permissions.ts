export type Permission =
  | "users.read" | "users.edit" | "users.suspend" | "users.ban" | "users.delete"
  | "posts.read" | "posts.delete" | "posts.restore" | "posts.moderate"
  | "reports.read" | "reports.assign" | "reports.resolve"
  | "settings.read" | "settings.write"
  | "features.read" | "features.write"
  | "analytics.read" | "audit.read"
  | "roles.read" | "roles.write";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  USER: [],
  MODERATOR: ["users.read", "posts.read", "posts.delete", "posts.restore", "posts.moderate", "reports.read", "reports.assign", "reports.resolve"],
  ADMIN: ["users.read", "users.edit", "users.suspend", "users.ban", "users.delete", "posts.read", "posts.delete", "posts.restore", "posts.moderate", "reports.read", "reports.assign", "reports.resolve", "settings.read", "settings.write", "features.read", "features.write", "analytics.read", "audit.read", "roles.read"],
  SUPER_ADMIN: ["users.read", "users.edit", "users.suspend", "users.ban", "users.delete", "posts.read", "posts.delete", "posts.restore", "posts.moderate", "reports.read", "reports.assign", "reports.resolve", "settings.read", "settings.write", "features.read", "features.write", "analytics.read", "audit.read", "roles.read", "roles.write"],
};

export function hasPermission(role: string, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
