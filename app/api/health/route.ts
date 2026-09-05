import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "pro-read60", database: "ok" });
  } catch {
    return NextResponse.json({ ok: false, service: "pro-read60", database: "unavailable" }, { status: 503 });
  }
}
