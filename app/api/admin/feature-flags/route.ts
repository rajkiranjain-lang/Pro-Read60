import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  try {
    await requirePermission("features.read");
    return NextResponse.json({ flags: await db.featureFlag.findMany({ orderBy: { key: "asc" } }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission("features.write");
    const body = await request.json();
    const key = String(body.key ?? "").trim();
    if (!key || typeof body.enabled !== "boolean") return NextResponse.json({ error: "Invalid feature flag" }, { status: 400 });
    const flag = await db.featureFlag.upsert({ where: { key }, create: { key, enabled: body.enabled }, update: { enabled: body.enabled } });
    await db.adminAuditLog.create({ data: { actorId: user.id, action: "FEATURE_FLAG_CHANGED", targetType: "FEATURE_FLAG", targetId: flag.id, afterJson: { key, enabled: body.enabled } } });
    return NextResponse.json({ flag });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}
