import React from "react";
import { prisma } from "@/lib/prisma";
import DepartmentsClient from "@/components/organization/DepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: { search?: string; branch_id?: string; status?: string };
}) {
  const search = (searchParams.search ?? "").trim();
  const branch_id = (searchParams.branch_id ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: Record<string, unknown> = {};
  if (branch_id) where.branchId = Number(branch_id);
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { headName: { contains: search } },
    ];
  }

  const [rows, branches, company] = await Promise.all([
    prisma.department.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        parent: { select: { name: true } },
        _count: { select: { children: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.company.findFirst({ where: { isDefault: true } }),
  ]);

  const departments = rows.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    branchName: d.branch?.name ?? null,
    parentName: d.parent?.name ?? null,
    headName: d.headName,
    subCount: d._count.children,
    isActive: d.isActive,
    createdAt: d.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <DepartmentsClient
      departments={departments}
      branches={branches}
      companyName={company?.name || "E-Hishabi ERP"}
      filters={{ search, branch_id, status }}
    />
  );
}
