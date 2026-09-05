import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await request.json();
  if (!userId || userId === me.id) return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  await db.blockedUser.upsert({ where: { blockerId_blockedId: { blockerId: me.id, blockedId: String(userId) } }, create: { blockerId: me.id, blockedId: String(userId) }, update: {} });
  return NextResponse.json({ blocked: true });
}

export async function DELETE(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  await db.blockedUser.deleteMany({ where: { blockerId: me.id, blockedId: String(userId) } });
  return NextResponse.json({ blocked: false });
}
