import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const b = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof b.isActive === "boolean") data.isActive = b.isActive;
  if (typeof b.isDefault === "boolean") {
    if (b.isDefault) await prisma.company.updateMany({ data: { isDefault: false } });
    data.isDefault = b.isDefault;
  }

  const company = await prisma.company.update({ where: { id }, data });
  await recordAudit(user.name, "updated", company.name, "Company", Object.keys(data));
  return NextResponse.json({ company });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const deleted = await prisma.company.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "Company", ["id"]);
  return NextResponse.json({ ok: true });
}
