import React from "react";
import { requireUser } from "@/lib/auth";
import { CoreService } from "@/server/services/core.service";
import ErpShell from "@/components/ErpShell";

export const dynamic = "force-dynamic";

export default async function ErpAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { company, projects } = await CoreService.getShellData();

  return (
    <ErpShell user={user} company={company} projects={projects}>
      {children}
    </ErpShell>
  );
}
