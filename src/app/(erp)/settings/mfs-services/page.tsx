import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MfsClient from "@/components/settings/MfsClient";

export const dynamic = "force-dynamic";

export default async function MfsServicesPage() {
  await requireUser();
  const services = await prisma.mfsService.findMany({ orderBy: { id: "asc" } });

  return (
    <MfsClient
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        accountName: s.accountName,
        accountNumber: s.accountNumber,
        accountType: s.accountType,
        isActive: s.isActive,
      }))}
    />
  );
}
