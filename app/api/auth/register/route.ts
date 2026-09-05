import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  const { username, email, password, displayName } = parsed.data;
  const exists = await db.user.findFirst({ where: { OR: [{ username }, { email }] }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { username, email, passwordHash, profile: { create: { displayName } }, preferences: { create: {} }, notificationPreferences: { create: {} } }, select: { id: true, username: true } });
  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
}
