import React from "react";
import { prisma } from "@/lib/prisma";
import DesignationsClient from "@/components/organization/DesignationsClient";

export const dynamic = "force-dynamic";

export default async function DesignationsPage({
  searchParams,
}: {
  searchParams: { search?: string; department_id?: string; status?: string };
}) {
  const search = (searchParams.search ?? "").trim();
  const department_id = (searchParams.department_id ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: Record<string, unknown> = {};
  if (department_id) where.departmentId = Number(department_id);
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [rows, departments, company] = await Promise.all([
    prisma.designation.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: [{ grade: "asc" }, { id: "asc" }],
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.company.findFirst({ where: { isDefault: true } }),
  ]);

  const designations = rows.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    departmentName: d.department?.name ?? null,
    employmentType: d.employmentType,
    grade: d.grade,
    description: d.description,
    isManagerial: d.isManagerial,
    isActive: d.isActive,
    createdBy: d.createdBy,
    createdAt: d.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <DesignationsClient
      designations={designations}
      departments={departments}
      companyName={company?.name || "E-Hishabi ERP"}
      filters={{ search, department_id, status }}
    />
  );
}
