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
  if (typeof b.role === "string") data.role = b.role;

  const updated = await prisma.user.update({ where: { id }, data });
  await recordAudit(user.name, "updated", updated.name, "User", Object.keys(data));
  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own active account." }, { status: 400 });
  }
  const deleted = await prisma.user.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.name, "User", ["id"]);
  return NextResponse.json({ ok: true });
}
