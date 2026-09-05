import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  const user = await requirePermission("features.read");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ flags });
}

export async function PATCH(request: NextRequest) {
  const user = await requirePermission("features.write");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const key = String(body.key ?? "").trim();
  if (!key || typeof body.enabled !== "boolean") return NextResponse.json({ error: "Invalid feature flag" }, { status: 400 });
  const flag = await prisma.featureFlag.upsert({ where: { key }, create: { key, enabled: body.enabled }, update: { enabled: body.enabled } });
  await prisma.adminAuditLog.create({ data: { actorId: user.id, action: "FEATURE_FLAG_CHANGED", targetType: "FEATURE_FLAG", targetId: flag.id, afterJson: { key, enabled: body.enabled } } });
  return NextResponse.json({ flag });
}
