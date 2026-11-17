import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InvoiceTemplatesClient from "@/components/settings/InvoiceTemplatesClient";

export const dynamic = "force-dynamic";

export default async function InvoiceTemplatesPage() {
  await requireUser();
  const templates = await prisma.invoiceTemplate.findMany({ orderBy: { id: "desc" } });

  return (
    <InvoiceTemplatesClient
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        paper: t.paper,
        orientation: t.orientation,
        isDefault: t.isDefault,
        isActive: t.isActive,
      }))}
    />
  );
}
