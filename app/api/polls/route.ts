import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const postId = String(body.postId ?? "");
  const optionIndex = Number(body.optionIndex);
  if (!postId || !Number.isInteger(optionIndex)) return NextResponse.json({ error: "Invalid poll vote" }, { status: 400 });
  const poll = await prisma.poll.findUnique({ where: { postId }, include: { options: true } });
  if (!poll || poll.expiresAt < new Date()) return NextResponse.json({ error: "Poll unavailable" }, { status: 404 });
  if (!poll.options.some((o) => o.position === optionIndex)) return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  try {
    const vote = await prisma.pollVote.create({ data: { pollId: poll.id, optionPosition: optionIndex, userId: user.id } });
    return NextResponse.json({ vote });
  } catch {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }
}
