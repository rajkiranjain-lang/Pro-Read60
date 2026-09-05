import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const hashtag = await db.hashtag.findUnique({ where: { tag: tag.replace(/^#/, "").toLowerCase() } });
  if (!hashtag) return NextResponse.json({ hashtag: null, posts: [], nextCursor: null });
  const posts = await db.post.findMany({ where: { deletedAt: null, visibility: "PUBLIC", hashtags: { some: { hashtagId: hashtag.id } } }, orderBy: { createdAt: "desc" }, take: 21, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), include: { author: { include: { profile: true, verification: true } }, _count: { select: { likes: true, replies: true, reposts: true } } } });
  return NextResponse.json({ hashtag, posts: posts.slice(0, 20), nextCursor: posts.length === 21 ? posts[20].id : null });
}
