import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

function publicMedia(asset: { id: string; url: string; mimeType: string; sizeBytes: bigint; width: number | null; height: number | null; durationMs: number | null; createdAt: Date }) {
  return { ...asset, sizeBytes: asset.sizeBytes.toString() };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 25), 1), 50);
  const assets = await db.mediaAsset.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: limit });
  return NextResponse.json(assets.map(publicMedia));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
  const sizeBytes = Number(body?.sizeBytes);
  const width = body?.width == null ? null : Number(body.width);
  const height = body?.height == null ? null : Number(body.height);
  const durationMs = body?.durationMs == null ? null : Number(body.durationMs);

  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "A valid media URL is required" }, { status: 400 });
  if (!ALLOWED.has(mimeType)) return NextResponse.json({ error: "Unsupported media type" }, { status: 400 });
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_BYTES) return NextResponse.json({ error: "Media size must be between 1 byte and 50 MB" }, { status: 400 });
  if (width !== null && (!Number.isSafeInteger(width) || width < 1 || width > 10000)) return NextResponse.json({ error: "Invalid width" }, { status: 400 });
  if (height !== null && (!Number.isSafeInteger(height) || height < 1 || height > 10000)) return NextResponse.json({ error: "Invalid height" }, { status: 400 });
  if (durationMs !== null && (!Number.isSafeInteger(durationMs) || durationMs < 0 || durationMs > 24 * 60 * 60 * 1000)) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

  const asset = await db.mediaAsset.create({ data: { ownerId: user.id, url, mimeType, sizeBytes: BigInt(sizeBytes), width, height, durationMs } });
  return NextResponse.json(publicMedia(asset), { status: 201 });
}
