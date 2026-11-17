import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const templates = await prisma.invoiceTemplate.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const name = String(b.name ?? "").trim();
  const type = String(b.type ?? "sale").trim();
  if (!name) return NextResponse.json({ error: "Template Name is required." }, { status: 400 });

  const isDefault = Boolean(b.is_default ?? b.isDefault);
  if (isDefault) {
    await prisma.invoiceTemplate.updateMany({ where: { type }, data: { isDefault: false } });
  }

  const template = await prisma.invoiceTemplate.create({
    data: {
      name,
      type,
      paper: String(b.paper ?? "a4"),
      orientation: String(b.orientation ?? "portrait"),
      isDefault,
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      blocksJson: typeof b.blocks === "string" ? b.blocks : JSON.stringify(b.blocks ?? []),
    },
  });

  await recordAudit(user.name, "created", template.name, "InvoiceTemplate", ["name", "type"]);
  return NextResponse.json({ template }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Template id required." }, { status: 400 });

  const deleted = await prisma.invoiceTemplate.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "InvoiceTemplate", ["id"]);
  return NextResponse.json({ ok: true });
}
