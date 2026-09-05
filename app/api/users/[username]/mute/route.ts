import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser(); const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === actor.id) return NextResponse.json({ error: "Cannot mute yourself" }, { status: 400 });
  await db.mutedUser.upsert({ where: { muterId_mutedId: { muterId: actor.id, mutedId: target.id } }, update: {}, create: { muterId: actor.id, mutedId: target.id } });
  return NextResponse.json({ muted: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const actor = await requireUser(); const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await db.mutedUser.deleteMany({ where: { muterId: actor.id, mutedId: target.id } });
  return NextResponse.json({ muted: false });
}
