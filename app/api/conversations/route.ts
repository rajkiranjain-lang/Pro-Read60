import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  const conversations = await db.conversation.findMany({ where: { members: { some: { userId: user.id } } }, include: { members: { include: { user: { select: { id: true, username: true, profile: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => null);
  const memberIds = Array.isArray(body?.memberIds) ? body.memberIds.filter((id: unknown): id is string => typeof id === "string") : [];
  const unique = [...new Set([user.id, ...memberIds])];
  if (unique.length < 2 || unique.length > 50) return NextResponse.json({ error: "A conversation needs 2-50 members" }, { status: 400 });
  const members = await db.user.findMany({ where: { id: { in: unique }, status: "ACTIVE" }, select: { id: true } });
  if (members.length !== unique.length) return NextResponse.json({ error: "One or more users are unavailable" }, { status: 400 });
  const conversation = await db.conversation.create({ data: { title: typeof body?.title === "string" ? body.title.slice(0, 120) : undefined, isGroup: unique.length > 2, members: { create: unique.map(userId => ({ userId })) } }, include: { members: { include: { user: { select: { id: true, username: true, profile: true } } } } } });
  return NextResponse.json(conversation, { status: 201 });
}
