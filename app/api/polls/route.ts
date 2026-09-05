import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type PollOptionRow = { id: string; position: number; label: string };
type PollVoteRow = { userId: string; optionPosition: number };

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const postId = request.nextUrl.searchParams.get("postId")?.trim() ?? "";
  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });
  const poll = await db.poll.findUnique({ where: { postId }, include: { options: true, votes: true } });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  const counts = new Map<number, number>();
  for (const option of poll.options as PollOptionRow[]) counts.set(option.position, 0);
  for (const vote of poll.votes as PollVoteRow[]) counts.set(vote.optionPosition, (counts.get(vote.optionPosition) ?? 0) + 1);
  return NextResponse.json({
    id: poll.id,
    postId: poll.postId,
    expiresAt: poll.expiresAt,
    closed: poll.expiresAt <= new Date(),
    totalVotes: poll.votes.length,
    options: (poll.options as PollOptionRow[]).sort((a: PollOptionRow, b: PollOptionRow) => a.position - b.position).map((option: PollOptionRow) => ({ id: option.id, position: option.position, label: option.label, votes: counts.get(option.position) ?? 0 })),
    voted: (poll.votes as PollVoteRow[]).some((vote: PollVoteRow) => vote.userId === user.id),
    selectedOption: (poll.votes as PollVoteRow[]).find((vote: PollVoteRow) => vote.userId === user.id)?.optionPosition ?? null,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  const optionPosition = Number(body?.optionIndex);
  if (!postId || !Number.isInteger(optionPosition)) return NextResponse.json({ error: "Invalid poll vote" }, { status: 400 });
  const poll = await db.poll.findUnique({ where: { postId }, include: { options: true } });
  if (!poll || poll.expiresAt <= new Date()) return NextResponse.json({ error: "Poll unavailable" }, { status: 404 });
  if (!(poll.options as PollOptionRow[]).some((o: PollOptionRow) => o.position === optionPosition)) return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  try {
    const vote = await db.pollVote.create({ data: { pollId: poll.id, optionPosition, userId: user.id } });
    return NextResponse.json({ vote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }
}
