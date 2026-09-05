import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  try { await requirePermission("features.read"); return NextResponse.json({ features: await db.featureFlag.findMany({ orderBy: { key: "asc" } }) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Forbidden" }, { status: 403 }); }
}

const schema = z.object({ key: z.string().min(2).max(100), enabled: z.boolean(), description: z.string().max(500).optional() });

export async function PUT(request: Request) {
  try {
    const actor = await requirePermission("features.write");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid feature flag" }, { status: 400 });
    const existing = await db.featureFlag.findUnique({ where: { key: parsed.data.key } });
    const feature = await db.featureFlag.upsert({ where: { key: parsed.data.key }, update: { enabled: parsed.data.enabled, description: parsed.data.description }, create: parsed.data });
    await db.adminAuditLog.create({ data: { actorId: actor.id, action: "FEATURE_CHANGED", targetType: "FEATURE_FLAG", targetId: feature.id, beforeJson: existing ? { enabled: existing.enabled } : undefined, afterJson: { enabled: feature.enabled } } });
    return NextResponse.json({ feature });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Forbidden" }, { status: 403 }); }
}
