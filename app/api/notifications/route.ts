import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 20), 1), 50);
  const cursor = params.get("cursor");
  const unreadOnly = params.get("unread") === "true";

  const notifications = await db.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = notifications.length > limit;
  const items = notifications.slice(0, limit);
  const actorIds: string[] = [...new Set(items.map((notification: { actorId: string | null }) => notification.actorId).filter((id): id is string => Boolean(id)))];
  const actors = actorIds.length
    ? await db.user.findMany({
        where: { id: { in: actorIds }, status: "ACTIVE" },
        select: { id: true, username: true, profile: true, verification: true },
      })
    : [];
  const actorById = new Map(actors.map((actor: { id: string }) => [actor.id, actor]));

  const result = items.map((notification: (typeof items)[number]) => ({
    ...notification,
    actor: notification.actorId ? actorById.get(notification.actorId) ?? null : null,
  }));

  const unreadCount = await db.notification.count({ where: { userId: user.id, readAt: null } });
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ notifications: result, unreadCount, nextCursor });
}
