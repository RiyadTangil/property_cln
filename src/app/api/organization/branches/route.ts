import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { departments: true } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ branches });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    const type = String(b.type ?? "branch").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "Branch Code and Name are required." }, { status: 400 });
    }

    const exists = await prisma.branch.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: `Branch code ${code} already exists.` }, { status: 409 });
    }

    const branch = await prisma.branch.create({
      data: {
        code,
        name,
        type,
        openedOn: b.opened_on?.trim() || null,
        phone: b.phone?.trim() || null,
        email: b.email?.trim() || null,
        managerName: b.manager_name?.trim() || null,
        addressLine1: b.address_line1?.trim() || null,
        addressLine2: b.address_line2?.trim() || null,
        city: b.city?.trim() || null,
        state: b.state?.trim() || null,
        postalCode: b.postal_code?.trim() || null,
        country: b.country?.trim() || "Bangladesh",
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
    });

    await recordAudit(user.name, "created", branch.name, "Branch", ["code", "name", "type"]);
    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    console.error("Create branch error:", err);
    return NextResponse.json({ error: "Failed to create branch." }, { status: 500 });
  }
}
