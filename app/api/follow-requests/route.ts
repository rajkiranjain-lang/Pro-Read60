import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  const requests = await db.followRequest.findMany({
    where: { targetId: user.id },
    orderBy: { createdAt: "desc" },
    include: { requester: { include: { profile: true, verification: true } } },
  });
  return NextResponse.json({ requests });
}

export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  const requestId = String(body?.requestId ?? "");
  const action = String(body?.action ?? "");
  if (!requestId || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const pending = await db.followRequest.findFirst({ where: { id: requestId, targetId: user.id } });
  if (!pending) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (action === "approve") {
    await db.$transaction([
      db.follow.create({ data: { followerId: pending.requesterId, followingId: user.id } }),
      db.followRequest.delete({ where: { id: requestId } }),
      db.notification.create({ data: { userId: pending.requesterId, actorId: user.id, type: "FOLLOW_ACCEPTED" } }),
    ]);
    return NextResponse.json({ approved: true });
  }
  await db.followRequest.delete({ where: { id: requestId } });
  return NextResponse.json({ rejected: true });
}
