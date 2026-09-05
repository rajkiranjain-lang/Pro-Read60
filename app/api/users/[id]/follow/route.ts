import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  const target = await db.user.findUnique({ where: { id }, include: { profile: true } });
  if (!target || target.status !== "ACTIVE") return NextResponse.json({ error: "User not found" }, { status: 404 });
  const blocked = await db.blockedUser.findFirst({ where: { OR: [{ blockerId: me.id, blockedId: id }, { blockerId: id, blockedId: me.id }] } });
  if (blocked) return NextResponse.json({ error: "Follow unavailable" }, { status: 403 });
  if (target.profile?.isPrivate) {
    await db.followRequest.upsert({ where: { requesterId_targetId: { requesterId: me.id, targetId: id } }, create: { requesterId: me.id, targetId: id }, update: {} });
    await db.notification.create({ data: { userId: id, actorId: me.id, type: "FOLLOW_REQUEST", entityId: me.id } });
    return NextResponse.json({ following: false, requested: true });
  }
  await db.follow.upsert({ where: { followerId_followingId: { followerId: me.id, followingId: id } }, create: { followerId: me.id, followingId: id }, update: {} });
  await db.notification.create({ data: { userId: id, actorId: me.id, type: "FOLLOW", entityId: me.id } });
  return NextResponse.json({ following: true, requested: false });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser(); if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.follow.deleteMany({ where: { followerId: me.id, followingId: id } });
  await db.followRequest.deleteMany({ where: { requesterId: me.id, targetId: id } });
  return NextResponse.json({ following: false, requested: false });
}
