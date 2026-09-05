import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true, authorId: true, deletedAt: true } });
  if (!post || post.deletedAt) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const existing = await db.like.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } });
  if (existing) { await db.like.delete({ where: { id: existing.id } }); return NextResponse.json({ liked: false }); }
  await db.like.create({ data: { userId: user.id, postId: id } });
  if (post.authorId !== user.id) await db.notification.create({ data: { userId: post.authorId, actorId: user.id, type: "LIKE", entityId: id } });
  return NextResponse.json({ liked: true });
}
