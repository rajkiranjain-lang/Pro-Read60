import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { featureEnabled, getSetting } from "@/lib/config";

const schema = z.object({ content: z.string().trim().min(1).max(10000), visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC") });

export async function POST(request: Request) {
  const user = await requireUser();
  if (!(await featureEnabled("POSTS_ENABLED"))) return NextResponse.json({ error: "Posting is disabled" }, { status: 403 });
  const max = await getSetting("MAX_POST_LENGTH", 500);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.content.length > max) return NextResponse.json({ error: `Post must be between 1 and ${max} characters` }, { status: 400 });
  const post = await db.post.create({ data: { authorId: user.id, content: parsed.data.content, visibility: parsed.data.visibility } });
  return NextResponse.json({ post }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url); const cursor = url.searchParams.get("cursor");
  const posts = await db.post.findMany({ where: { deletedAt: null, visibility: "PUBLIC" }, include: { author: { include: { profile: true, verification: true } }, _count: { select: { likes: true, replies: true, reposts: true } } }, orderBy: { createdAt: "desc" }, take: 21, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
  const nextCursor = posts.length === 21 ? posts[20].id : null;
  return NextResponse.json({ posts: posts.slice(0, 20), nextCursor });
}
