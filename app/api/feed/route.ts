import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const following = user ? await db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }) : [];
  const authorIds = following.map((x) => x.followingId);
  const muted = user ? await db.mutedUser.findMany({ where: { muterId: user.id }, select: { mutedId: true } }) : [];
  const blocked = user ? await db.blockedUser.findMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] }, select: { blockerId: true, blockedId: true } }) : [];
  const hiddenIds = new Set(blocked.flatMap((x) => [x.blockerId, x.blockedId]));
  if (user) hiddenIds.delete(user.id);
  const excludedAuthorIds = [...new Set([...muted.map((x) => x.mutedId), ...hiddenIds])];
  const posts = await db.post.findMany({
    where: { deletedAt: null, visibility: "PUBLIC", authorId: { in: [user?.id ?? "", ...authorIds], notIn: excludedAuthorIds } },
    include: { author: { include: { profile: true, verification: true } }, media: { include: { media: true }, orderBy: { position: "asc" } }, poll: { include: { options: true } }, _count: { select: { likes: true, replies: true, reposts: true, bookmarks: true } } },
    orderBy: { createdAt: "desc" }, take: 21, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });
  return NextResponse.json({ posts: posts.slice(0, 20), nextCursor: posts.length === 21 ? posts[20].id : null });
}
