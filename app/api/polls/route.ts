import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const postId = String(body.postId ?? "");
  const optionPosition = Number(body.optionIndex);
  if (!postId || !Number.isInteger(optionPosition)) return NextResponse.json({ error: "Invalid poll vote" }, { status: 400 });
  const poll = await db.poll.findUnique({ where: { postId }, include: { options: true } });
  if (!poll || poll.expiresAt <= new Date()) return NextResponse.json({ error: "Poll unavailable" }, { status: 404 });
  if (!poll.options.some((o) => o.position === optionPosition)) return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  try {
    const vote = await db.pollVote.create({ data: { pollId: poll.id, optionPosition, userId: user.id } });
    return NextResponse.json({ vote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }
}
