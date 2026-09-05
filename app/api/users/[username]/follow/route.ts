import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser(); const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, include: { profile: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === actor.id) return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  const blocked = await db.blockedUser.findFirst({ where: { OR: [{ blockerId: actor.id, blockedId: target.id }, { blockerId: target.id, blockedId: actor.id }] } });
  if (blocked) return NextResponse.json({ error: "Follow unavailable" }, { status: 403 });
  const existing = await db.follow.findUnique({ where: { followerId_followingId: { followerId: actor.id, followingId: target.id } } });
  if (existing) { await db.follow.delete({ where: { id: existing.id } }); return NextResponse.json({ following: false }); }
  if (target.profile?.isPrivate) { await db.followRequest.upsert({ where: { requesterId_targetId: { requesterId: actor.id, targetId: target.id } }, update: {}, create: { requesterId: actor.id, targetId: target.id } }); await db.notification.create({ data: { userId: target.id, actorId: actor.id, type: "FOLLOW_REQUEST" } }); return NextResponse.json({ following: false, requested: true }); }
  await db.follow.create({ data: { followerId: actor.id, followingId: target.id } });
  await db.notification.create({ data: { userId: target.id, actorId: actor.id, type: "FOLLOW" } });
  return NextResponse.json({ following: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser(); const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await db.follow.deleteMany({ where: { followerId: actor.id, followingId: target.id } });
  await db.followRequest.deleteMany({ where: { requesterId: actor.id, targetId: target.id } });
  return NextResponse.json({ following: false });
}
