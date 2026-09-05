import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const type = request.nextUrl.searchParams.get("type") ?? "all";
  if (q.length < 2 || q.length > 100) return NextResponse.json({ users: [], posts: [], hashtags: [] });

  const [users, posts, hashtags] = await Promise.all([
    type === "posts" ? [] : db.user.findMany({ where: { OR: [{ username: { contains: q, mode: "insensitive" } }, { profile: { displayName: { contains: q, mode: "insensitive" } } }], status: "ACTIVE" }, include: { profile: true, verification: true }, take: 20 }),
    type === "users" ? [] : db.post.findMany({ where: { content: { contains: q, mode: "insensitive" }, deletedAt: null, visibility: "PUBLIC" }, include: { author: { include: { profile: true, verification: true } }, _count: { select: { likes: true, replies: true, reposts: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    type === "users" || type === "posts" ? [] : db.hashtag.findMany({ where: { tag: { contains: q.replace(/^#/, ""), mode: "insensitive" } }, orderBy: { usageCount: "desc" }, take: 20 })
  ]);
  return NextResponse.json({ users, posts, hashtags });
}
