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

  const branch = await prisma.branch.update({ where: { id }, data });
  await recordAudit(user.name, "updated", branch.name, "Branch", Object.keys(data));
  return NextResponse.json({ branch });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const deleted = await prisma.branch.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "Branch", ["id"]);
  return NextResponse.json({ ok: true });
}
