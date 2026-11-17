import React from "react";
import { prisma } from "@/lib/prisma";
import CompaniesClient from "@/components/organization/CompaniesClient";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
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
      { email: { contains: search } },
      { tin: { contains: search } },
    ];
  }

  const rows = await prisma.company.findMany({ where, orderBy: { id: "asc" } });
  const companies = rows.map((c) => ({
    ...c,
    createdAt: c.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return <CompaniesClient companies={companies} filters={{ search, status }} />;
}
