import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fiscalYears = await prisma.fiscalYear.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json({ fiscalYears });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    const startDate = String(b.start_date ?? "").trim();
    const endDate = String(b.end_date ?? "").trim();
    if (!code || !name || !startDate || !endDate) {
      return NextResponse.json({ error: "Code, Name, Start Date, and End Date are required." }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({ error: "End Date must be after Start Date." }, { status: 400 });
    }

    const exists = await prisma.fiscalYear.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: `Fiscal year code ${code} already exists.` }, { status: 409 });
    }

    const isCurrent = Boolean(b.is_current);
    if (isCurrent) {
      await prisma.fiscalYear.updateMany({ data: { isCurrent: false } });
    }

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        code,
        name,
        startDate,
        endDate,
        periodCadence: String(b.period_cadence ?? "monthly"),
        hasAdjustmentPeriod: Boolean(b.has_adjustment_period),
        isCurrent,
        status: isCurrent ? "open" : String(b.status ?? "open"),
        notes: b.notes?.trim() || null,
      },
    });

    await recordAudit(user.name, "created", fiscalYear.name, "FiscalYear", ["code", "startDate", "endDate"]);
    return NextResponse.json({ fiscalYear }, { status: 201 });
  } catch (err) {
    console.error("Create fiscal year error:", err);
    return NextResponse.json({ error: "Failed to create fiscal year." }, { status: 500 });
  }
}
