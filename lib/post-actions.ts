import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function getPostForAction(postId: string) {
  const user = await requireUser();
  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true, deletedAt: true, replyLocked: true } });
  if (!post || post.deletedAt) throw new Error("POST_NOT_FOUND");
  const blocked = await db.blockedUser.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: post.authorId }, { blockerId: post.authorId, blockedId: user.id }] } });
  if (blocked) throw new Error("POST_UNAVAILABLE");
  return { user, post };
}

export function actionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "POST_NOT_FOUND") return { error: "Post not found", status: 404 };
  if (message === "POST_UNAVAILABLE") return { error: "Post unavailable", status: 403 };
  return { error: "Unauthorized", status: 401 };
}
