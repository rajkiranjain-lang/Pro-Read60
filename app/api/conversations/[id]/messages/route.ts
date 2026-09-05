import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId: user.id } } });
  if (!member) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const messages = await db.message.findMany({ where: { conversationId: id, deletedAt: null }, include: { sender: { select: { id: true, username: true, profile: true } }, media: { include: { media: true } } }, orderBy: { createdAt: "asc" }, take: 100 });
  await db.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: new Date() } });
  return NextResponse.json(messages);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId: user.id } } });
  if (!member) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 10000) return NextResponse.json({ error: "Message must contain 1-10000 characters" }, { status: 400 });
  const blocked = await db.blockedUser.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: { in: (await db.conversationMember.findMany({ where: { conversationId: id, NOT: { userId: user.id } }, select: { userId: true } })).map(x => x.userId) } }, { blockerId: { in: [user.id] }, blockedId: user.id }] } });
  if (blocked) return NextResponse.json({ error: "Messaging is unavailable" }, { status: 403 });
  const message = await db.message.create({ data: { conversationId: id, senderId: user.id, content }, include: { sender: { select: { id: true, username: true, profile: true } } } });
  return NextResponse.json(message, { status: 201 });
}
