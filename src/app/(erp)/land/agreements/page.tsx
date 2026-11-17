import React from "react";
import { prisma } from "@/lib/prisma";
import AgreementsClient from "@/components/land/AgreementsClient";

export const dynamic = "force-dynamic";

export default async function LandAgreementsPage({
  searchParams,
}: {
  searchParams: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    type?: string;
    flag?: string;
  };
}) {
  const from = (searchParams.from ?? "").trim();
  const to = (searchParams.to ?? "").trim();
  const search = (searchParams.search ?? "").trim();
  const status = (searchParams.status ?? "").trim();
  const type = (searchParams.type ?? "").trim();
  const flag = (searchParams.flag ?? "").trim();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (from || to) {
    where.agreementDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (flag === "unsettled_advance") {
    where.advanceAmount = { gt: 0 };
    where.advanceSettled = false;
  }
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { parcel: { code: { contains: search } } },
      { parcel: { mouza: { contains: search } } },
      { owner: { name: { contains: search } } },
    ];
  }

  const [agreements, parcels, owners] = await Promise.all([
    prisma.landAgreement.findMany({
      where,
      include: {
        parcel: { select: { id: true, code: true, title: true, mouza: true } },
        owner: { select: { id: true, code: true, name: true } },
      },
      orderBy: { id: "desc" },
    }),
    prisma.landParcel.findMany({
      orderBy: { id: "desc" },
      select: { id: true, code: true, title: true, mouza: true },
    }),
    prisma.landOwner.findMany({
      orderBy: { id: "desc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <AgreementsClient
      agreements={agreements}
      parcels={parcels}
      owners={owners}
      filters={{ from, to, search, status, type, flag }}
    />
  );
}
