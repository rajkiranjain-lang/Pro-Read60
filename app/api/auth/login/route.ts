import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, username: true, passwordHash: true, status: true } });
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
