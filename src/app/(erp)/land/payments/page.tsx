import React from "react";
import { prisma } from "@/lib/prisma";
import PaymentsClient from "@/components/land/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function LandPaymentsPage({
  searchParams,
}: {
  searchParams: {
    from?: string;
    to?: string;
    search?: string;
    direction?: string;
    type?: string;
    status?: string;
  };
}) {
  const from = (searchParams.from ?? "").trim();
  const to = (searchParams.to ?? "").trim();
  const search = (searchParams.search ?? "").trim();
  const direction = (searchParams.direction ?? "").trim();
  const type = (searchParams.type ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: Record<string, unknown> = {};
  if (direction) where.direction = direction;
  if (type) where.type = type;
  if (status) where.status = status;
  if (from || to) {
    where.paymentDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (search) {
    where.OR = [
      { voucherNo: { contains: search } },
      { chequeNo: { contains: search } },
      { transactionReference: { contains: search } },
      { parcel: { code: { contains: search } } },
      { owner: { name: { contains: search } } },
    ];
  }

  const [payments, parcels, owners] = await Promise.all([
    prisma.landPayment.findMany({
      where,
      include: {
        parcel: { select: { id: true, code: true, title: true, mouza: true } },
        owner: { select: { id: true, name: true } },
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
    <PaymentsClient
      payments={payments}
      parcels={parcels}
      owners={owners}
      filters={{ from, to, search, direction, type, status }}
    />
  );
}
