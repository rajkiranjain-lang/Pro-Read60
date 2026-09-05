import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  const user = await requirePermission("settings.read");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ settings: await prisma.platformSetting.findMany({ orderBy: { key: "asc" } }) });
}

export async function PATCH(request: NextRequest) {
  const user = await requirePermission("settings.write");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const key = String(body.key ?? "").trim();
  if (!key || body.value === undefined) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  const setting = await prisma.platformSetting.upsert({ where: { key }, create: { key, value: body.value }, update: { value: body.value } });
  await prisma.adminAuditLog.create({ data: { actorId: user.id, action: "SETTING_CHANGED", targetType: "PLATFORM_SETTING", targetId: setting.id, afterJson: { key, value: body.value } } });
  return NextResponse.json({ setting });
}
