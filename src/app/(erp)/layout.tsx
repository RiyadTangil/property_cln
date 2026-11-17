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
  const { company, projects, primaryColor } = await CoreService.getShellData();

  const themeCss = `:root {
  --erp-primary: ${primaryColor};
  --erp-primary-dark: color-mix(in srgb, ${primaryColor} 78%, #000000);
  --erp-primary-ink: color-mix(in srgb, ${primaryColor} 78%, #000000);
  --erp-primary-soft: color-mix(in srgb, ${primaryColor} 13%, transparent);
  --erp-accent: ${primaryColor};
  --erp-accent-soft: color-mix(in srgb, ${primaryColor} 12%, transparent);
  --erp-table-head-bg: color-mix(in srgb, ${primaryColor} 35%, transparent);
}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <ErpShell user={user} company={company} projects={projects} primaryColor={primaryColor}>
        {children}
      </ErpShell>
    </>
  );
}
