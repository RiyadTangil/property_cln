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
    if (b.isDefault) await prisma.shift.updateMany({ data: { isDefault: false } });
    data.isDefault = b.isDefault;
  }

  const shift = await prisma.shift.update({ where: { id }, data });
  await recordAudit(user.name, "updated", shift.name, "Shift", Object.keys(data));
  return NextResponse.json({ shift });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const deleted = await prisma.shift.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "Shift", ["id"]);
  return NextResponse.json({ ok: true });
}
