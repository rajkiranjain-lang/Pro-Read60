import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPostForAction } from "@/lib/post-actions";

export async function POST(_: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { user, post } = await getPostForAction((await params).postId);
    const existing = await db.repost.findUnique({ where: { userId_postId: { userId: user.id, postId: post.id } } });
    if (existing) { await db.repost.delete({ where: { id: existing.id } }); return NextResponse.json({ reposted: false }); }
    await db.repost.create({ data: { userId: user.id, postId: post.id } });
    if (post.authorId !== user.id) await db.notification.create({ data: { userId: post.authorId, actorId: user.id, type: "REPOST", entityId: post.id } });
    return NextResponse.json({ reposted: true });
  } catch (e) { const msg = e instanceof Error ? e.message : ""; return NextResponse.json({ error: msg === "POST_NOT_FOUND" ? "Post not found" : "Post unavailable" }, { status: msg === "POST_NOT_FOUND" ? 404 : 403 }); }
}
