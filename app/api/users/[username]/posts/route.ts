import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const user = await db.user.findUnique({ where: { username: username.toLowerCase() }, include: { profile: true } });
  if (!user || user.status !== "ACTIVE" || !user.profile?.discoverable) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const posts = await db.post.findMany({ where: { authorId: user.id, deletedAt: null, visibility: "PUBLIC" }, orderBy: { createdAt: "desc" }, take: 21, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), include: { media: { include: { media: true }, orderBy: { position: "asc" } }, _count: { select: { likes: true, replies: true, reposts: true, bookmarks: true } } } });
  return NextResponse.json({ posts: posts.slice(0, 20), nextCursor: posts.length === 21 ? posts[20].id : null });
}
