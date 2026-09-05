import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  try {
    await requirePermission("reports.read");
    const reports = await db.report.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission("reports.resolve");
    const body = await request.json();
    const id = String(body.id ?? "");
    const status = String(body.status ?? "");
    if (!id || !["OPEN", "ASSIGNED", "RESOLVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid report update" }, { status: 400 });
    const report = await db.report.update({ where: { id }, data: { status: status as never, assignedToId: user.id, resolution: body.resolution ? String(body.resolution).slice(0, 2000) : undefined } });
    await db.adminAuditLog.create({ data: { actorId: user.id, action: "REPORT_UPDATED", targetType: "REPORT", targetId: id, afterJson: { status } } });
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" }, { status: 403 });
  }
}
