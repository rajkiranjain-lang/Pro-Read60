import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser();
  const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === actor.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  await db.$transaction([
    db.blockedUser.upsert({ where: { blockerId_blockedId: { blockerId: actor.id, blockedId: target.id } }, update: {}, create: { blockerId: actor.id, blockedId: target.id } }),
    db.follow.deleteMany({ where: { OR: [{ followerId: actor.id, followingId: target.id }, { followerId: target.id, followingId: actor.id }] } })
  ]);
  return NextResponse.json({ blocked: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser();
  const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await db.blockedUser.deleteMany({ where: { blockerId: actor.id, blockedId: target.id } });
  return NextResponse.json({ blocked: false });
}
