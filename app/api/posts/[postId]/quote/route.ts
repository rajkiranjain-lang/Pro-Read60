import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPostForAction } from "@/lib/post-actions";

const schema = z.object({ content: z.string().trim().min(1).max(10000) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { user, post } = await getPostForAction((await params).postId);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Quote text is required" }, { status: 400 });
    const quote = await db.quotePost.create({ data: { userId: user.id, quotedPostId: post.id, content: parsed.data.content } });
    if (post.authorId !== user.id) await db.notification.create({ data: { userId: post.authorId, actorId: user.id, type: "QUOTE", entityId: quote.id } });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) { const msg = e instanceof Error ? e.message : ""; return NextResponse.json({ error: msg === "POST_NOT_FOUND" ? "Post not found" : "Post unavailable" }, { status: msg === "POST_NOT_FOUND" ? 404 : 403 }); }
}
