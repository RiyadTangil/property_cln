import React from "react";
import { prisma } from "@/lib/prisma";
import ProposalsClient from "@/components/land/ProposalsClient";

export const dynamic = "force-dynamic";

export default async function LandProposalsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; search?: string; status?: string };
}) {
  const from = (searchParams.from ?? "").trim();
  const to = (searchParams.to ?? "").trim();
  const search = (searchParams.search ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.proposalDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { parcel: { code: { contains: search } } },
      { parcel: { mouza: { contains: search } } },
      { parcel: { title: { contains: search } } },
    ];
  }

  const [proposals, parcels] = await Promise.all([
    prisma.landProposal.findMany({
      where,
      include: {
        parcel: {
          select: { id: true, code: true, title: true, mouza: true, areaSqft: true },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.landParcel.findMany({
      orderBy: { id: "desc" },
      select: { id: true, code: true, title: true, mouza: true, areaSqft: true },
    }),
  ]);

  return (
    <ProposalsClient
      proposals={proposals}
      parcels={parcels}
      filters={{ from, to, search, status }}
    />
  );
}
