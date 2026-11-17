import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const setting = await prisma.appSetting.findFirst();
  return NextResponse.json({ setting });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const appName = String(b.app_name ?? "e-Hishabi ERP").trim();
  if (!appName) {
    return NextResponse.json({ error: "Application Title is required." }, { status: 400 });
  }

  const existing = await prisma.appSetting.findFirst();
  const data = {
    appName,
    appTagline: String(b.app_tagline ?? "").trim(),
    footerText: String(b.footer_text ?? "").trim(),
    contactEmail: String(b.contact_email ?? "").trim(),
    contactPhone: String(b.contact_phone ?? "").trim(),
    website: String(b.website ?? "").trim(),
    contactAddress: String(b.contact_address ?? "").trim(),
    primaryColor: String(b.primary_color ?? "#00c292").trim(),
  };

  const setting = existing
    ? await prisma.appSetting.update({ where: { id: existing.id }, data })
    : await prisma.appSetting.create({ data });

  await recordAudit(user.name, "updated", setting.appName, "AppSetting", Object.keys(data));
  return NextResponse.json({ setting });
}
