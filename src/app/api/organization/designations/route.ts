import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const designations = await prisma.designation.findMany({
    include: { department: true },
    orderBy: [{ grade: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ designations });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();

    if (Array.isArray(b.items)) {
      const created = [];
      for (const row of b.items) {
        const code = String(row.code ?? "").trim().toUpperCase();
        const name = String(row.name ?? "").trim();
        if (!code || !name) continue;
        const ds = await prisma.designation.create({
          data: {
            code,
            name,
            departmentId: row.department_id ? Number(row.department_id) : null,
            employmentType: row.employment_type || "full_time",
            grade: row.grade || null,
            isManagerial: Boolean(row.is_managerial),
            isActive: true,
            createdBy: user.name,
          },
        });
        created.push(ds);
      }
      if (created.length > 0) {
        await recordAudit(user.name, "created", `${created.length} designations`, "Designation", ["bulk"]);
      }
      return NextResponse.json({ created }, { status: 201 });
    }

    const code = String(b.code ?? "").trim().toUpperCase();
    const name = String(b.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "Code and Designation Title are required." }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: {
        code,
        name,
        departmentId: b.department_id ? Number(b.department_id) : null,
        employmentType: String(b.employment_type ?? "full_time"),
        grade: b.grade ? String(b.grade) : null,
        description: b.description?.trim() || null,
        isManagerial: Boolean(b.is_managerial),
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
        createdBy: user.name,
      },
    });

    await recordAudit(user.name, "created", designation.name, "Designation", ["code", "name"]);
    return NextResponse.json({ designation }, { status: 201 });
  } catch (err) {
    console.error("Create designation error:", err);
    return NextResponse.json({ error: "Failed to create designation." }, { status: 500 });
  }
}
