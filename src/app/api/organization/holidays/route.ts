import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const holidays = await prisma.holiday.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json({ holidays });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const name = String(b.name ?? "").trim();
    const startDate = String(b.start_date ?? "").trim();
    const endDate = String(b.end_date ?? b.start_date ?? "").trim();
    if (!name || !startDate) {
      return NextResponse.json({ error: "Holiday Name and Start Date are required." }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        type: String(b.type ?? "public"),
        startDate,
        endDate: endDate || startDate,
        color: String(b.color ?? "#00c292"),
        description: b.description?.trim() || null,
        appliesTo: String(b.applies_to ?? "all"),
        isRecurring: Boolean(b.is_recurring),
        isPaid: b.is_paid === undefined ? true : Boolean(b.is_paid),
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
    });

    await recordAudit(user.name, "created", holiday.name, "Holiday", ["name", "startDate", "type"]);
    return NextResponse.json({ holiday }, { status: 201 });
  } catch (err) {
    console.error("Create holiday error:", err);
    return NextResponse.json({ error: "Failed to create holiday." }, { status: 500 });
  }
}
