import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mediaKey, validateMediaFile } from "@/lib/media";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? "");
  const type = String(body.type ?? "");
  const size = Number(body.size);
  if (!name || !type || !Number.isFinite(size) || size < 0) {
    return NextResponse.json({ error: "Invalid media metadata" }, { status: 400 });
  }
  const result = validateMediaFile({ size, type });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 415 });
  return NextResponse.json({ key: mediaKey(user.id, name), kind: result.kind, uploadRequired: true });
}
