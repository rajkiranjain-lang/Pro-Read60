import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

async function getMemberUserIds(conversationId: string, userId: string): Promise<string[]> {
  const members = await db.conversationMember.findMany({ where: { conversationId, NOT: { userId } }, select: { userId: true } });
  return members.map((member: { userId: string }) => member.userId);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId: user.id } } });
  if (!member) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const messages = await db.message.findMany({
    where: { conversationId: id, deletedAt: null },
    include: { sender: { select: { id: true, username: true, profile: true } }, media: { include: { media: true } } },
    orderBy: { createdAt: "asc" }, take: 100
  });
  await db.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: new Date() } });
  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId: user.id } } });
  if (!member) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 10000) return NextResponse.json({ error: "Message must contain 1-10000 characters" }, { status: 400 });

  const recipientIds: string[] = await getMemberUserIds(id, user.id);
  const blocked = recipientIds.length
    ? await db.blockedUser.findFirst({ where: { OR: recipientIds.flatMap((recipientId: string) => [
      { blockerId: user.id, blockedId: recipientId },
      { blockerId: recipientId, blockedId: user.id }
    ]) } })
    : null;
  if (blocked) return NextResponse.json({ error: "Messaging is unavailable" }, { status: 403 });

  const message = await db.message.create({ data: { conversationId: id, senderId: user.id, content }, include: { sender: { select: { id: true, username: true, profile: true } } } });

  if (recipientIds.length) {
    await db.notification.createMany({ data: recipientIds.map((userId: string) => ({ userId, actorId: user.id, type: "MESSAGE" as const, entityId: message.id })) });
  }
  return NextResponse.json(message, { status: 201 });
}
