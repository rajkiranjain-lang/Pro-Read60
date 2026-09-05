import { cookies } from "next/headers";
import crypto from "node:crypto";
import { db } from "./db";

const COOKIE = "pr60_session";
const DAYS = 30;

function hash(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }

export async function createSession(userId: string) {
  const raw = crypto.randomBytes(32).toString("hex");
  await db.session.create({ data: { userId, tokenHash: hash(raw), expiresAt: new Date(Date.now() + DAYS * 86400000) } });
  const jar = await cookies();
  jar.set(COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await db.session.deleteMany({ where: { tokenHash: hash(raw) } });
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(raw) }, include: { user: { include: { profile: true, verification: true } } } });
  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requirePermission(permission: import("./permissions").Permission) {
  const user = await requireUser();
  const { hasPermission } = await import("./permissions");
  if (!hasPermission(user.role, permission)) throw new Error("FORBIDDEN");
  return user;
}
