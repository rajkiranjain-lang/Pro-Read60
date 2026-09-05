import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
  const user = await requirePermission("reports.read");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ reports });
}

export async function PATCH(request: NextRequest) {
  const user = await requirePermission("reports.resolve");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  if (!id || !["OPEN", "ASSIGNED", "RESOLVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid report update" }, { status: 400 });
  const report = await prisma.report.update({ where: { id }, data: { status: status as never, assignedToId: user.id, resolution: body.resolution ? String(body.resolution).slice(0, 2000) : undefined } });
  await prisma.adminAuditLog.create({ data: { actorId: user.id, action: "REPORT_UPDATED", targetType: "REPORT", targetId: id, afterJson: { status } } });
  return NextResponse.json({ report });
}
