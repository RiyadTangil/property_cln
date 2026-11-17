import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companies = await prisma.company.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "Company Code and Name are required." }, { status: 400 });
    }

    const isDefault = Boolean(b.is_default ?? b.isDefault);
    if (isDefault) {
      await prisma.company.updateMany({ data: { isDefault: false } });
    }

    const fyMonth = Number(b.financial_year_start_month ?? b.fyStartMonth ?? 7);
    const fyDay = Number(b.financial_year_start_day ?? b.fyStartDay ?? 1);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const endMonthIdx = (fyMonth + 10) % 12;
    const fiscalYear = `${fyDay} ${months[(fyMonth - 1) % 12] || "Jul"} – 30 ${months[endMonthIdx] || "Jun"}`;

    const company = await prisma.company.create({
      data: {
        code,
        name,
        legalName: b.legal_name?.trim() || null,
        incorporationDate: b.incorporation_date?.trim() || null,
        registrationNumber: b.registration_number?.trim() || null,
        tin: b.tax_identification_number?.trim() || null,
        email: b.email?.trim() || null,
        phone: b.phone?.trim() || null,
        website: b.website?.trim() || null,
        addressLine1: b.address_line1?.trim() || null,
        addressLine2: b.address_line2?.trim() || null,
        city: b.city?.trim() || null,
        state: b.state?.trim() || null,
        postalCode: b.postal_code?.trim() || null,
        country: b.country?.trim() || "Bangladesh",
        currency: b.currency?.trim() || "BDT",
        timezone: b.timezone?.trim() || "Asia/Dhaka",
        fyStartMonth: fyMonth,
        fyStartDay: fyDay,
        branch: code,
        fiscalYear,
        isDefault,
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
    });

    await recordAudit(user.name, "created", company.name, "Company", ["code", "name", "currency"]);
    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error("Create company error:", err);
    return NextResponse.json({ error: "Failed to create company." }, { status: 500 });
  }
}
