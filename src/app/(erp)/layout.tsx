import React from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ErpShell from "@/components/ErpShell";

export const dynamic = "force-dynamic";

export default async function ErpAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const [companyRecord, projects] = await Promise.all([
    prisma.company.findFirst({ where: { isActive: true } }),
    prisma.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true, code: true, name: true, status: true },
    }),
  ]);

  const company = companyRecord ?? {
    id: 1,
    name: "E-Hishabi ERP",
    branch: "HQ",
    fiscalYear: "FY 1 Jul – 30 Jun",
  };

  return (
    <ErpShell user={user} company={company} projects={projects}>
      {children}
    </ErpShell>
  );
}
