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

  if (Array.isArray(b.permissions)) {
    const unique = Array.from(new Set(b.permissions.map(String)));
    data.permissionsJson = JSON.stringify(unique);
    data.permissionsCount = unique.length;
  }
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
  if (typeof b.scope === "string") data.scope = b.scope;

  const role = await prisma.role.update({ where: { id }, data });
  await recordAudit(user.name, "updated", role.name, "Role", Object.keys(data));
  return NextResponse.json({ role });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.role.findUnique({ where: { id } });
  if (existing?.isSuper) {
    return NextResponse.json({ error: "Super Admin role cannot be deleted." }, { status: 400 });
  }
  const deleted = await prisma.role.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "Role", ["id"]);
  return NextResponse.json({ ok: true });
}
