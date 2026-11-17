import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const services = await prisma.mfsService.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Service Name is required." }, { status: 400 });

  const service = await prisma.mfsService.create({
    data: {
      name,
      shortName: b.short_name?.trim() || null,
      accountName: b.account_name?.trim() || null,
      accountNumber: b.account_number?.trim() || null,
      accountType: b.account_type?.trim() || null,
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
    },
  });

  await recordAudit(user.name, "created", service.name, "MfsService", ["name", "accountNumber"]);
  return NextResponse.json({ service }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const id = Number(b.id);
  if (!id) return NextResponse.json({ error: "Service id required." }, { status: 400 });

  const service = await prisma.mfsService.update({
    where: { id },
    data: {
      name: String(b.name ?? "").trim() || undefined,
      shortName: b.short_name?.trim() || null,
      accountName: b.account_name?.trim() || null,
      accountNumber: b.account_number?.trim() || null,
      accountType: b.account_type?.trim() || null,
      isActive: b.is_active === undefined ? undefined : Boolean(b.is_active),
    },
  });

  await recordAudit(user.name, "updated", service.name, "MfsService", ["name", "accountNumber"]);
  return NextResponse.json({ service });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Service id required." }, { status: 400 });

  const deleted = await prisma.mfsService.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "MfsService", ["id"]);
  return NextResponse.json({ ok: true });
}
