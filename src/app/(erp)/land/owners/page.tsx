import React from "react";
import { prisma } from "@/lib/prisma";
import OwnersClient from "@/components/land/OwnersClient";

export const dynamic = "force-dynamic";

export default async function LandOwnersPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    kind?: string;
    district?: string;
    status?: string;
    flag?: string;
  };
}) {
  const search = (searchParams.search ?? "").trim();
  const kind = (searchParams.kind ?? "").trim();
  const district = (searchParams.district ?? "").trim();
  const status = (searchParams.status ?? "").trim();
  const flag = (searchParams.flag ?? "").trim();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nid: { contains: search } },
      { phone: { contains: search } },
      { code: { contains: search } },
    ];
  }
  if (kind) where.kind = kind;
  if (district) where.district = { contains: district };
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  let owners = await prisma.landOwner.findMany({
    where,
    orderBy: { id: "desc" },
  });

  if (flag === "no_payout") {
    owners = owners.filter((o) => !o.bankAccountNo && !o.mfsNumber);
  } else if (flag === "blocked") {
    owners = owners.filter(
      (o) =>
        (o.isMinor && !o.guardianName) ||
        (o.isDeceased && !o.successionCertificateNo)
    );
  }

  return (
    <OwnersClient
      owners={owners}
      filters={{ search, kind, district, status, flag }}
    />
  );
}
