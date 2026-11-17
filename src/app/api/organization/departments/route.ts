import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const departments = await prisma.department.findMany({
    include: { branch: true, parent: true, _count: { select: { children: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ departments });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();

    // Bulk add support
    if (Array.isArray(b.items)) {
      const created = [];
      for (const row of b.items) {
        const code = String(row.code ?? "").trim().toUpperCase();
        const name = String(row.name ?? "").trim();
        if (!code || !name) continue;
        const exists = await prisma.department.findUnique({ where: { code } });
        if (exists) continue;
        const dep = await prisma.department.create({
          data: {
            code,
            name,
            branchId: row.branch_id ? Number(row.branch_id) : null,
            parentId: row.parent_id ? Number(row.parent_id) : null,
            headName: row.head_name?.trim() || null,
            isActive: true,
          },
        });
        created.push(dep);
      }
      if (created.length > 0) {
        await recordAudit(user.name, "created", `${created.length} departments`, "Department", ["bulk"]);
      }
      return NextResponse.json({ created }, { status: 201 });
    }

    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "Department Code and Name are required." }, { status: 400 });
    }

    const exists = await prisma.department.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: `Department code ${code} already exists.` }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
        branchId: b.branch_id ? Number(b.branch_id) : null,
        parentId: b.parent_id ? Number(b.parent_id) : null,
        headName: b.head_name?.trim() || null,
        email: b.email?.trim() || null,
        phone: b.phone?.trim() || null,
        description: b.description?.trim() || null,
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
    });

    await recordAudit(user.name, "created", department.name, "Department", ["code", "name"]);
    return NextResponse.json({ department }, { status: 201 });
  } catch (err) {
    console.error("Create department error:", err);
    return NextResponse.json({ error: "Failed to create department." }, { status: 500 });
  }
}
