import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const user = await db.user.findUnique({ where: { username: username.toLowerCase() }, include: { profile: true, verification: true, _count: { select: { posts: true, followers: true, following: true } } } });
  if (!user || user.status !== "ACTIVE" || !user.profile?.discoverable) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const blocked = viewer ? await db.blockedUser.findFirst({ where: { OR: [{ blockerId: viewer.id, blockedId: user.id }, { blockerId: user.id, blockedId: viewer.id }] } }) : null;
  if (blocked && viewer?.id !== user.id) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const posts = await db.post.findMany({ where: { authorId: user.id, deletedAt: null, ...(user.profile.isPrivate && viewer?.id !== user.id ? { visibility: "PUBLIC" } : {}) }, orderBy: { createdAt: "desc" }, take: 20, include: { media: { include: { media: true }, orderBy: { position: "asc" } }, _count: { select: { likes: true, replies: true, reposts: true, bookmarks: true } } } });
  return NextResponse.json({ user: { id: user.id, username: user.username, profile: user.profile, verification: user.verification, counts: user._count }, posts });
}
