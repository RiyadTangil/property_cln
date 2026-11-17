import React from "react";
import { prisma } from "@/lib/prisma";
import BranchesClient from "@/components/organization/BranchesClient";

export const dynamic = "force-dynamic";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const search = (searchParams.search ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: Record<string, unknown> = {};
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { city: { contains: search } },
      { managerName: { contains: search } },
    ];
  }

  const [rows, company] = await Promise.all([
    prisma.branch.findMany({
      where,
      include: { _count: { select: { departments: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.company.findFirst({ where: { isDefault: true } }),
  ]);

  const branches = rows.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    type: b.type,
    managerName: b.managerName,
    city: b.city,
    country: b.country,
    deptsCount: b._count.departments,
    isActive: b.isActive,
    createdAt: b.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <BranchesClient
      branches={branches}
      companyName={company?.name || "E-Hishabi ERP"}
      filters={{ search, status }}
    />
  );
}
