import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shifts = await prisma.shift.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ shifts });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "Shift Code and Name are required." }, { status: 400 });
    }

    const exists = await prisma.shift.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: `Shift code ${code} already exists.` }, { status: 409 });
    }

    const isDefault = Boolean(b.is_default);
    if (isDefault) {
      await prisma.shift.updateMany({ data: { isDefault: false } });
    }

    const days = Array.isArray(b.working_days)
      ? b.working_days.join(",")
      : String(b.working_days ?? "sun,mon,tue,wed,thu");

    const shift = await prisma.shift.create({
      data: {
        code,
        name,
        startTime: String(b.start_time ?? "09:00"),
        endTime: String(b.end_time ?? "18:00"),
        breakMinutes: Number(b.break_minutes ?? 60),
        graceInMinutes: Number(b.grace_in_minutes ?? 15),
        graceOutMinutes: Number(b.grace_out_minutes ?? 15),
        fullDayMinutes: Number(b.full_day_minutes ?? 480),
        halfDayMinutes: Number(b.half_day_minutes ?? 240),
        workingDays: days,
        appliesTo: String(b.applies_to ?? "all"),
        description: b.description?.trim() || null,
        isDefault,
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
    });

    await recordAudit(user.name, "created", shift.name, "Shift", ["code", "startTime", "endTime"]);
    return NextResponse.json({ shift }, { status: 201 });
  } catch (err) {
    console.error("Create shift error:", err);
    return NextResponse.json({ error: "Failed to create shift." }, { status: 500 });
  }
}
