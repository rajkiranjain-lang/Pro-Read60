import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPostForAction } from "@/lib/post-actions";

const schema = z.object({ content: z.string().trim().min(1).max(10000), parentId: z.string().cuid().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { user, post } = await getPostForAction((await params).postId);
    if (post.replyLocked) return NextResponse.json({ error: "Replies are locked" }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
    if (parsed.data.parentId) {
      const parent = await db.reply.findFirst({ where: { id: parsed.data.parentId, postId: post.id, deletedAt: null } });
      if (!parent) return NextResponse.json({ error: "Parent reply not found" }, { status: 404 });
    }
    const reply = await db.reply.create({ data: { postId: post.id, authorId: user.id, parentId: parsed.data.parentId, content: parsed.data.content } });
    if (post.authorId !== user.id) await db.notification.create({ data: { userId: post.authorId, actorId: user.id, type: "REPLY", entityId: post.id } });
    return NextResponse.json({ reply }, { status: 201 });
  } catch (e) { const msg = e instanceof Error ? e.message : ""; return NextResponse.json({ error: msg === "POST_NOT_FOUND" ? "Post not found" : "Post unavailable" }, { status: msg === "POST_NOT_FOUND" ? 404 : 403 }); }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const postId = (await params).postId;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const replies = await db.reply.findMany({ where: { postId, deletedAt: null }, orderBy: { createdAt: "asc" }, take: 51, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  return NextResponse.json({ replies: replies.slice(0, 50), nextCursor: replies.length === 51 ? replies[50].id : null });
}
