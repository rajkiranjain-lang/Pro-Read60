import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await request.json();
  if (!userId || userId === me.id) return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  await db.mutedUser.upsert({ where: { muterId_mutedId: { muterId: me.id, mutedId: String(userId) } }, create: { muterId: me.id, mutedId: String(userId) }, update: {} });
  return NextResponse.json({ muted: true });
}

export async function DELETE(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  await db.mutedUser.deleteMany({ where: { muterId: me.id, mutedId: String(userId) } });
  return NextResponse.json({ muted: false });
}
