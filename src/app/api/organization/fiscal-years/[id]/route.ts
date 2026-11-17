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
  if (typeof b.status === "string") data.status = b.status;
  if (typeof b.isCurrent === "boolean") {
    if (b.isCurrent) await prisma.fiscalYear.updateMany({ data: { isCurrent: false } });
    data.isCurrent = b.isCurrent;
  }

  const fiscalYear = await prisma.fiscalYear.update({ where: { id }, data });
  await recordAudit(user.name, "updated", fiscalYear.name, "FiscalYear", Object.keys(data));
  return NextResponse.json({ fiscalYear });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const deleted = await prisma.fiscalYear.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "FiscalYear", ["id"]);
  return NextResponse.json({ ok: true });
}
