import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const name = String(b.name ?? "").trim();
    const scope = String(b.scope ?? "global").trim();
    if (!name) {
      return NextResponse.json({ error: "Role Name is required." }, { status: 400 });
    }

    const exists = await prisma.role.findUnique({ where: { name } });
    if (exists) {
      return NextResponse.json({ error: `Role "${name}" already exists.` }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        scope,
        isSuper: false,
        permissionsCount: 0,
        permissionsJson: "[]",
      },
    });

    await recordAudit(user.name, "created", role.name, "Role", ["name", "scope"]);
    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    console.error("Create role error:", err);
    return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
  }
}
