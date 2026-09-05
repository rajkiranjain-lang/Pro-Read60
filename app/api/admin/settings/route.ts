import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  try {
    await requirePermission("settings.read");
    return NextResponse.json({ settings: await db.platformSetting.findMany({ orderBy: { key: "asc" } }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission("settings.write");
    const body = await request.json();
    const key = String(body.key ?? "").trim();
    if (!key || body.value === undefined) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
    const setting = await db.platformSetting.upsert({ where: { key }, create: { key, value: body.value }, update: { value: body.value } });
    await db.adminAuditLog.create({ data: { actorId: user.id, action: "SETTING_CHANGED", targetType: "PLATFORM_SETTING", targetId: setting.id, afterJson: { key, value: body.value } } });
    return NextResponse.json({ setting });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}
