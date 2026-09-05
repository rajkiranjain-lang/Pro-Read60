import { db } from "@/lib/db";

export async function canViewPost(viewerId: string | null, post: { authorId: string; visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE" }) {
  if (post.authorId === viewerId) return true;
  if (post.visibility === "PUBLIC") return true;
  if (!viewerId) return false;
  const blocked = await db.blockedUser.findFirst({ where: { OR: [{ blockerId: viewerId, blockedId: post.authorId }, { blockerId: post.authorId, blockedId: viewerId }] } });
  if (blocked) return false;
  if (post.visibility === "PRIVATE") return false;
  return !!(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: post.authorId } } }));
}

export function normalizeHashtags(content: string) {
  return [...new Set((content.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((x) => x.slice(1).toLowerCase()).filter(Boolean))].slice(0, 20);
}

export function normalizeMentions(content: string) {
  return [...new Set((content.match(/@[a-zA-Z0-9_]{1,30}/g) ?? []).map((x) => x.slice(1).toLowerCase()).filter(Boolean))].slice(0, 20);
}
