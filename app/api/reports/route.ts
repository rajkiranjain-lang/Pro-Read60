import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "");
  const reason = String(body.reason ?? "").trim();
  const allowed = ["POST", "REPLY", "USER", "PROFILE", "MEDIA", "MESSAGE"];
  if (!allowed.includes(targetType) || !targetId || !reason || reason.length > 500) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  const report = await prisma.report.create({ data: { reporterId: user.id, targetType: targetType as never, targetId, reason } });
  return NextResponse.json({ report }, { status: 201 });
}
