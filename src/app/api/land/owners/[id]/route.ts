import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const owner = await prisma.landOwner.update({ where: { id }, data });
  return NextResponse.json({ owner });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await prisma.landOwner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
